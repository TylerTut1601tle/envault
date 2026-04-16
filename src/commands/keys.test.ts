import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { listVaultKeys, formatKeysResult } from './keys';
import { encryptEnvFile } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-keys-'));
}

const PASSWORD = 'test-password-keys';

describe('listVaultKeys', () => {
  it('returns keys from an encrypted vault', async () => {
    const dir = makeTempDir();
    const content = 'FOO=bar\nBAZ=qux\n';
    const envPath = path.join(dir, '.env');
    fs.writeFileSync(envPath, content);
    await encryptEnvFile(envPath, PASSWORD);

    const result = await listVaultKeys(dir, '.env', PASSWORD);
    expect(result.keys).toContain('FOO');
    expect(result.keys).toContain('BAZ');
    expect(result.count).toBe(2);
  });

  it('throws if vault does not exist', async () => {
    const dir = makeTempDir();
    await expect(listVaultKeys(dir, '.env.missing', PASSWORD)).rejects.toThrow('Vault not found');
  });

  it('returns empty keys for empty vault', async () => {
    const dir = makeTempDir();
    const envPath = path.join(dir, '.env');
    fs.writeFileSync(envPath, '');
    await encryptEnvFile(envPath, PASSWORD);

    const result = await listVaultKeys(dir, '.env', PASSWORD);
    expect(result.count).toBe(0);
    expect(result.keys).toEqual([]);
  });
});

describe('formatKeysResult', () => {
  it('formats keys list', () => {
    const out = formatKeysResult({ vault: '.env', keys: ['A', 'B'], count: 2 });
    expect(out).toContain('A');
    expect(out).toContain('B');
    expect(out).toContain('.env');
  });

  it('handles empty vault', () => {
    const out = formatKeysResult({ vault: '.env', keys: [], count: 0 });
    expect(out).toContain('no keys');
  });
});
