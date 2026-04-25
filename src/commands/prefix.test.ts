import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runPrefix, formatPrefixResult } from './prefix';
import { encryptEnvFile, decryptVaultFile, getVaultPath } from '../crypto/vault';

async function makeTempDir(): Promise<string> {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-prefix-'));
}

const PASSWORD = 'test-password';
const INITIAL_ENV = 'DB_HOST=localhost\nDB_PORT=5432\nAPP_SECRET=abc123\n';

describe('runPrefix', () => {
  it('adds prefix to all unprefixed keys', async () => {
    const dir = await makeTempDir();
    const envFile = path.join(dir, '.env');
    await encryptEnvFile(envFile, INITIAL_ENV, PASSWORD);

    const result = await runPrefix(envFile, { prefix: 'PROD_' }, PASSWORD);
    expect(result.renamed.length).toBe(3);
    expect(result.renamed[0]).toEqual({ from: 'DB_HOST', to: 'PROD_DB_HOST' });
    expect(result.skipped.length).toBe(0);
  });

  it('skips keys that already have the prefix', async () => {
    const dir = await makeTempDir();
    const envFile = path.join(dir, '.env');
    await encryptEnvFile(envFile, 'PROD_DB_HOST=localhost\nDB_PORT=5432\n', PASSWORD);

    const result = await runPrefix(envFile, { prefix: 'PROD_' }, PASSWORD);
    expect(result.renamed.length).toBe(1);
    expect(result.skipped.length).toBe(1);
    expect(result.skipped[0].key).toBe('PROD_DB_HOST');
  });

  it('dry run does not write changes', async () => {
    const dir = await makeTempDir();
    const envFile = path.join(dir, '.env');
    await encryptEnvFile(envFile, INITIAL_ENV, PASSWORD);
    const vaultPath = getVaultPath(envFile);
    const statBefore = fs.statSync(vaultPath).mtimeMs;

    const result = await runPrefix(envFile, { prefix: 'STAGING_', dryRun: true }, PASSWORD);
    expect(result.renamed.length).toBe(3);
    const statAfter = fs.statSync(vaultPath).mtimeMs;
    expect(statAfter).toBe(statBefore);
  });

  it('persists renamed keys to vault', async () => {
    const dir = await makeTempDir();
    const envFile = path.join(dir, '.env');
    await encryptEnvFile(envFile, 'FOO=1\nBAR=2\n', PASSWORD);

    await runPrefix(envFile, { prefix: 'X_' }, PASSWORD);
    const vaultPath = getVaultPath(envFile);
    const decrypted = await decryptVaultFile(vaultPath, PASSWORD);
    expect(decrypted).toContain('X_FOO=1');
    expect(decrypted).toContain('X_BAR=2');
    expect(decrypted).not.toContain('\nFOO=');
  });

  it('throws if vault does not exist', async () => {
    const dir = await makeTempDir();
    const envFile = path.join(dir, '.env');
    await expect(runPrefix(envFile, { prefix: 'X_' }, PASSWORD)).rejects.toThrow('Vault not found');
  });

  it('normalizes prefix to uppercase', async () => {
    const dir = await makeTempDir();
    const envFile = path.join(dir, '.env');
    await encryptEnvFile(envFile, 'NAME=alice\n', PASSWORD);

    const result = await runPrefix(envFile, { prefix: 'app_' }, PASSWORD);
    expect(result.renamed[0].to).toBe('APP_NAME');
  });
});

describe('formatPrefixResult', () => {
  it('shows renamed and skipped keys', () => {
    const result = {
      renamed: [{ from: 'FOO', to: 'X_FOO' }],
      skipped: [{ key: 'X_BAR', reason: 'already has prefix' }],
      vaultPath: '/tmp/.env.vault',
    };
    const output = formatPrefixResult(result);
    expect(output).toContain('FOO → X_FOO');
    expect(output).toContain('X_BAR');
    expect(output).toContain('1 key(s) prefixed');
  });

  it('shows dry run notice', () => {
    const result = { renamed: [], skipped: [], vaultPath: '/tmp/.env.vault' };
    const output = formatPrefixResult(result, true);
    expect(output).toContain('dry run');
  });
});
