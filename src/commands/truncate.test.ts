import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { encryptEnvFile, getVaultPath } from '../crypto/vault';
import { formatTruncateResult, runTruncate } from './truncate';

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-truncate-'));
}

const PASSWORD = 'test-password';
const SAMPLE_ENV = 'A=1\nB=2\nC=3\nD=4\nE=5\n';

async function setupVault(dir: string, name = '.env') {
  const vaultPath = getVaultPath(dir, name);
  await encryptEnvFile(SAMPLE_ENV, vaultPath, PASSWORD);
  return vaultPath;
}

test('truncate keeps first N keys', async () => {
  const dir = makeTempDir();
  await setupVault(dir);
  const result = await runTruncate({ file: '.env', keep: 3, password: PASSWORD, repoRoot: dir });
  expect(result.originalCount).toBe(5);
  expect(result.keptCount).toBe(3);
  expect(result.removedCount).toBe(2);
});

test('truncate with keep >= total is a no-op', async () => {
  const dir = makeTempDir();
  await setupVault(dir);
  const result = await runTruncate({ file: '.env', keep: 10, password: PASSWORD, repoRoot: dir });
  expect(result.removedCount).toBe(0);
  expect(result.keptCount).toBe(5);
});

test('truncate with keep=0 removes all keys', async () => {
  const dir = makeTempDir();
  await setupVault(dir);
  const result = await runTruncate({ file: '.env', keep: 0, password: PASSWORD, repoRoot: dir });
  expect(result.keptCount).toBe(0);
  expect(result.removedCount).toBe(5);
});

test('truncate throws on negative keep', async () => {
  const dir = makeTempDir();
  await setupVault(dir);
  await expect(runTruncate({ file: '.env', keep: -1, password: PASSWORD, repoRoot: dir })).rejects.toThrow();
});

test('truncate throws if vault not found', async () => {
  const dir = makeTempDir();
  await expect(runTruncate({ file: '.env', keep: 2, password: PASSWORD, repoRoot: dir })).rejects.toThrow();
});

test('formatTruncateResult with removals', () => {
  const msg = formatTruncateResult({ file: '.env', originalCount: 5, keptCount: 3, removedCount: 2 });
  expect(msg).toContain('3/5');
  expect(msg).toContain('removed 2');
});

test('formatTruncateResult no removals', () => {
  const msg = formatTruncateResult({ file: '.env', originalCount: 5, keptCount: 5, removedCount: 0 });
  expect(msg).toContain('No keys removed');
});
