import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { grepVaults, formatGrepResult } from './grep';
import { encryptEnvFile, getVaultPath } from '../crypto/vault';
import * as fsp from 'fs/promises';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-grep-'));
}

const PASSWORD = 'test-password';

async function createVault(dir: string, name: string, content: string): Promise<void> {
  await fsp.mkdir(path.join(dir, '.envault'), { recursive: true });
  const vaultPath = getVaultPath(dir, name);
  await encryptEnvFile(content, vaultPath, PASSWORD);
}

test('finds matching key across vaults', async () => {
  const dir = makeTempDir();
  await createVault(dir, 'dev', 'DB_HOST=localhost\nAPI_KEY=secret123\n');
  await createVault(dir, 'prod', 'DB_HOST=prod.db\nAWS_SECRET=abc\n');

  const result = await grepVaults('DB_', ['dev', 'prod'], PASSWORD, dir);
  expect(result.matches).toHaveLength(2);
  expect(result.vaultsSearched).toBe(2);
  expect(result.matches.map(m => m.key)).toEqual(expect.arrayContaining(['DB_HOST', 'DB_HOST']));
});

test('returns no matches when pattern does not match', async () => {
  const dir = makeTempDir();
  await createVault(dir, 'dev', 'API_KEY=secret\n');

  const result = await grepVaults('NONEXISTENT', ['dev'], PASSWORD, dir);
  expect(result.matches).toHaveLength(0);
  expect(result.vaultsSearched).toBe(1);
});

test('searches values when searchValues is true', async () => {
  const dir = makeTempDir();
  await createVault(dir, 'dev', 'API_KEY=my-secret-value\n');

  const result = await grepVaults('secret', ['dev'], PASSWORD, dir, true);
  expect(result.matches).toHaveLength(1);
  expect(result.matches[0].key).toBe('API_KEY');
});

test('skips non-existent vaults gracefully', async () => {
  const dir = makeTempDir();
  await createVault(dir, 'dev', 'KEY=val\n');

  const result = await grepVaults('KEY', ['dev', 'missing'], PASSWORD, dir);
  expect(result.vaultsSearched).toBe(1);
  expect(result.matches).toHaveLength(1);
});

test('returns error for invalid regex', async () => {
  const dir = makeTempDir();
  const result = await grepVaults('[invalid(', ['dev'], PASSWORD, dir);
  expect(result.error).toBeDefined();
  expect(result.matches).toHaveLength(0);
});

test('formatGrepResult shows no-match message', () => {
  const out = formatGrepResult({ matches: [], vaultsSearched: 2 });
  expect(out).toContain('No matches found');
  expect(out).toContain('2 vault(s)');
});

test('formatGrepResult hides values by default', () => {
  const out = formatGrepResult({ matches: [{ key: 'API_KEY', value: 'secret', vault: 'dev' }], vaultsSearched: 1 });
  expect(out).toContain('API_KEY');
  expect(out).not.toContain('secret');
});

test('formatGrepResult shows values when requested', () => {
  const out = formatGrepResult({ matches: [{ key: 'API_KEY', value: 'secret', vault: 'dev' }], vaultsSearched: 1 }, true);
  expect(out).toContain('=secret');
});
