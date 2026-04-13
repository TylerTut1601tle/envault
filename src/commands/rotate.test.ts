import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { rotateKey, rotateAllKeys, formatRotateResult } from './rotate';
import { encryptEnvFile, getVaultPath } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-rotate-'));
}

describe('rotateKey', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should re-encrypt vault with new passphrase', async () => {
    const envFile = path.join(tmpDir, '.env');
    const content = 'API_KEY=secret123\nDB_URL=postgres://localhost/db';
    fs.writeFileSync(envFile, content);

    await encryptEnvFile(envFile, 'old-pass');
    const vaultPath = getVaultPath(envFile);
    expect(fs.existsSync(vaultPath)).toBe(true);

    await rotateKey(envFile, 'old-pass', 'new-pass');

    // Old passphrase should no longer work
    const { decryptVaultFile } = await import('../crypto/vault');
    await expect(decryptVaultFile(vaultPath, 'old-pass')).rejects.toThrow();

    // New passphrase should work
    const decrypted = await decryptVaultFile(vaultPath, 'new-pass');
    expect(decrypted).toContain('API_KEY=secret123');
  });

  it('should throw if vault file does not exist', async () => {
    const envFile = path.join(tmpDir, '.env.missing');
    await expect(rotateKey(envFile, 'old', 'new')).rejects.toThrow('Vault file not found');
  });

  it('should throw if old passphrase is wrong', async () => {
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'FOO=bar');
    await encryptEnvFile(envFile, 'correct-pass');

    await expect(rotateKey(envFile, 'wrong-pass', 'new-pass')).rejects.toThrow();
  });
});

describe('formatRotateResult', () => {
  it('should format success and failure lists', () => {
    const result = {
      success: ['.env.vault', '.env.staging.vault'],
      failed: [{ file: '.env.prod.vault', error: 'wrong passphrase' }],
    };
    const output = formatRotateResult(result);
    expect(output).toContain('✔ Rotated (2)');
    expect(output).toContain('.env.vault');
    expect(output).toContain('✖ Failed (1)');
    expect(output).toContain('.env.prod.vault: wrong passphrase');
  });

  it('should handle all success', () => {
    const result = { success: ['.env.vault'], failed: [] };
    const output = formatRotateResult(result);
    expect(output).toContain('✔ Rotated (1)');
    expect(output).not.toContain('✖');
  });
});
