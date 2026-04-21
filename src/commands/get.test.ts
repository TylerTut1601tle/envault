import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runGet, formatGetResult } from './get';
import { encryptEnvFile, getVaultPath } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-get-'));
}

const PASSWORD = 'test-password-get';
const ENV_FILE = '.env';

async function setupVault(dir: string, content: string): Promise<void> {
  const vaultPath = getVaultPath(ENV_FILE, dir);
  const vaultDir = path.dirname(vaultPath);
  fs.mkdirSync(vaultDir, { recursive: true });
  const encrypted = await encryptEnvFile(content, PASSWORD);
  fs.writeFileSync(vaultPath, encrypted, 'utf-8');
}

test('runGet returns found=true for existing key', async () => {
  const dir = makeTempDir();
  await setupVault(dir, 'API_KEY=secret123\nDB_URL=postgres://localhost/db\n');

  const result = await runGet(ENV_FILE, 'API_KEY', PASSWORD, dir);
  expect(result.found).toBe(true);
  expect(result.key).toBe('API_KEY');
  expect(result.value).toBe('secret123');
});

test('runGet returns found=false for missing key', async () => {
  const dir = makeTempDir();
  await setupVault(dir, 'API_KEY=secret123\n');

  const result = await runGet(ENV_FILE, 'MISSING_KEY', PASSWORD, dir);
  expect(result.found).toBe(false);
  expect(result.value).toBeUndefined();
});

test('runGet throws when vault file does not exist', async () => {
  const dir = makeTempDir();
  await expect(runGet(ENV_FILE, 'ANY_KEY', PASSWORD, dir)).rejects.toThrow('Vault file not found');
});

test('formatGetResult returns key=value when found', () => {
  const result = { key: 'FOO', value: 'bar', found: true, vaultFile: '.envault/.env.vault' };
  expect(formatGetResult(result)).toBe('FOO=bar');
});

test('formatGetResult returns raw value when raw=true', () => {
  const result = { key: 'FOO', value: 'bar', found: true, vaultFile: '.envault/.env.vault' };
  expect(formatGetResult(result, true)).toBe('bar');
});

test('formatGetResult returns not found message when key missing', () => {
  const result = { key: 'MISSING', value: undefined, found: false, vaultFile: '.envault/.env.vault' };
  const output = formatGetResult(result);
  expect(output).toContain('MISSING');
  expect(output).toContain('not found');
});
