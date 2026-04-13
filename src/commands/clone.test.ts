import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { runClone, formatCloneResult } from './clone';
import { encryptEnvFile, getVaultPath } from '../crypto/vault';
import { decryptVaultFile } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-clone-'));
}

describe('runClone', () => {
  let tmpDir: string;
  const password = 'test-password-clone';

  beforeEach(() => {
    tmpDir = makeTempDir();
    fs.mkdirSync(path.join(tmpDir, '.envault'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('clones a vault to a new destination', async () => {
    const entries = [{ key: 'FOO', value: 'bar' }, { key: 'BAZ', value: 'qux' }];
    const sourceVault = getVaultPath('.env', tmpDir);
    await encryptEnvFile(entries, sourceVault, password);

    const result = await runClone('.env', '.env.clone', password, tmpDir);
    expect(result.success).toBe(true);
    expect(result.source).toBe('.env');
    expect(result.destination).toBe('.env.clone');

    const destVault = getVaultPath('.env.clone', tmpDir);
    expect(fs.existsSync(destVault)).toBe(true);

    const cloned = await decryptVaultFile(destVault, password);
    expect(cloned).toEqual(entries);
  });

  it('fails if source vault does not exist', async () => {
    const result = await runClone('.env.missing', '.env.clone', password, tmpDir);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found/);
  });

  it('fails if destination vault already exists', async () => {
    const entries = [{ key: 'X', value: '1' }];
    const sourceVault = getVaultPath('.env', tmpDir);
    const destVault = getVaultPath('.env.clone', tmpDir);
    await encryptEnvFile(entries, sourceVault, password);
    await encryptEnvFile(entries, destVault, password);

    const result = await runClone('.env', '.env.clone', password, tmpDir);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/already exists/);
  });
});

describe('formatCloneResult', () => {
  it('formats success', () => {
    const msg = formatCloneResult({ source: '.env', destination: '.env.clone', success: true });
    expect(msg).toContain('✓');
    expect(msg).toContain('.env.clone');
  });

  it('formats failure', () => {
    const msg = formatCloneResult({ source: '.env', destination: '.env.clone', success: false, error: 'oops' });
    expect(msg).toContain('✗');
    expect(msg).toContain('oops');
  });
});
