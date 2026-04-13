import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { runClone } from './clone';
import { encryptEnvFile, getVaultPath, decryptVaultFile } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-clone-reg-'));
}

describe('clone integration', () => {
  let tmpDir: string;
  const password = 'clone-reg-pass';

  beforeEach(() => {
    tmpDir = makeTempDir();
    fs.mkdirSync(path.join(tmpDir, '.envault'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('preserves all key-value entries after clone', async () => {
    const entries = [
      { key: 'DATABASE_URL', value: 'postgres://localhost/mydb' },
      { key: 'SECRET_KEY', value: 'supersecret' },
      { key: 'PORT', value: '3000' },
    ];
    const sourceVault = getVaultPath('.env', tmpDir);
    await encryptEnvFile(entries, sourceVault, password);

    const result = await runClone('.env', '.env.test', password, tmpDir);
    expect(result.success).toBe(true);

    const destVault = getVaultPath('.env.test', tmpDir);
    const cloned = await decryptVaultFile(destVault, password);
    expect(cloned).toHaveLength(3);
    expect(cloned).toEqual(expect.arrayContaining(entries));
  });

  it('source and destination vaults are independent', async () => {
    const entries = [{ key: 'A', value: '1' }];
    const sourceVault = getVaultPath('.env', tmpDir);
    await encryptEnvFile(entries, sourceVault, password);

    await runClone('.env', '.env.copy', password, tmpDir);

    // Overwrite source with new data
    await encryptEnvFile([{ key: 'A', value: '999' }], sourceVault, password);

    const destVault = getVaultPath('.env.copy', tmpDir);
    const cloned = await decryptVaultFile(destVault, password);
    expect(cloned[0].value).toBe('1');
  });
});
