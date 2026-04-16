import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { trimVault, formatTrimResult } from './trim';
import { encryptEnvFile, getVaultPath } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-trim-'));
}

const PASSWORD = 'test-password';

async function createVault(dir: string, name: string, content: string): Promise<void> {
  const vaultPath = getVaultPath(dir, name);
  fs.mkdirSync(path.dirname(vaultPath), { recursive: true });
  await encryptEnvFile(vaultPath, content, PASSWORD);
}

test('removes empty value entries', async () => {
  const dir = makeTempDir();
  await createVault(dir, 'test', 'KEY1=value1\nEMPTY=\nKEY2=value2\n');
  const result = await trimVault(dir, 'test', PASSWORD);
  expect(result.removed).toContain('EMPTY');
  expect(result.total).toBe(2);
});

test('returns empty removed list when no empty entries', async () => {
  const dir = makeTempDir();
  await createVault(dir, 'test', 'KEY1=value1\nKEY2=value2\n');
  const result = await trimVault(dir, 'test', PASSWORD);
  expect(result.removed).toHaveLength(0);
  expect(result.total).toBe(2);
});

test('throws if vault does not exist', async () => {
  const dir = makeTempDir();
  await expect(trimVault(dir, 'missing', PASSWORD)).rejects.toThrow('Vault not found');
});

test('formatTrimResult shows removed keys', () => {
  const result = { vaultPath: '/tmp/test.vault', removed: ['EMPTY', 'BLANK'], total: 3 };
  const output = formatTrimResult(result);
  expect(output).toContain('Removed 2 empty entry(ies)');
  expect(output).toContain('- EMPTY');
  expect(output).toContain('Remaining entries: 3');
});

test('formatTrimResult shows no empty message', () => {
  const result = { vaultPath: '/tmp/test.vault', removed: [], total: 5 };
  const output = formatTrimResult(result);
  expect(output).toContain('No empty entries found.');
});
