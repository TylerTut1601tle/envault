import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { pluckKeys, formatPluckResult } from './pluck';
import { encryptEnvFile } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-pluck-'));
}

const PASSWORD = 'test-password-123';
const ENV_CONTENT = 'API_KEY=abc123\nDB_HOST=localhost\nDB_PORT=5432\nSECRET=mysecret\n';

async function setupVault(dir: string, envFile = '.env'): Promise<void> {
  const encrypted = await encryptEnvFile(ENV_CONTENT, PASSWORD);
  const vaultPath = path.join(dir, `.${envFile}.vault`);
  fs.writeFileSync(vaultPath, encrypted, 'utf-8');
}

describe('pluckKeys', () => {
  it('returns found keys from vault', async () => {
    const dir = makeTempDir();
    await setupVault(dir);
    const result = await pluckKeys(dir, '.env', ['API_KEY', 'DB_HOST'], PASSWORD);
    expect(result.found).toEqual({ API_KEY: 'abc123', DB_HOST: 'localhost' });
    expect(result.missing).toEqual([]);
  });

  it('reports missing keys', async () => {
    const dir = makeTempDir();
    await setupVault(dir);
    const result = await pluckKeys(dir, '.env', ['API_KEY', 'NONEXISTENT'], PASSWORD);
    expect(result.found).toEqual({ API_KEY: 'abc123' });
    expect(result.missing).toEqual(['NONEXISTENT']);
  });

  it('returns all missing when no keys match', async () => {
    const dir = makeTempDir();
    await setupVault(dir);
    const result = await pluckKeys(dir, '.env', ['FOO', 'BAR'], PASSWORD);
    expect(result.found).toEqual({});
    expect(result.missing).toEqual(['FOO', 'BAR']);
  });

  it('throws if vault does not exist', async () => {
    const dir = makeTempDir();
    await expect(pluckKeys(dir, '.env', ['API_KEY'], PASSWORD)).rejects.toThrow('Vault not found');
  });

  it('throws on wrong password', async () => {
    const dir = makeTempDir();
    await setupVault(dir);
    await expect(pluckKeys(dir, '.env', ['API_KEY'], 'wrong-password')).rejects.toThrow();
  });
});

describe('formatPluckResult', () => {
  it('formats found and missing keys', () => {
    const result = {
      found: { API_KEY: 'abc123', DB_HOST: 'localhost' },
      missing: ['FOO'],
      vaultPath: '/tmp/test/.env.vault',
    };
    const output = formatPluckResult(result);
    expect(output).toContain('Plucked keys:');
    expect(output).toContain('API_KEY=abc123');
    expect(output).toContain('Missing keys:');
    expect(output).toContain('FOO');
  });

  it('omits missing section when all keys found', () => {
    const result = {
      found: { API_KEY: 'abc123' },
      missing: [],
      vaultPath: '/tmp/test/.env.vault',
    };
    const output = formatPluckResult(result);
    expect(output).toContain('Plucked keys:');
    expect(output).not.toContain('Missing keys:');
  });
});
