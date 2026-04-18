import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runStrip, formatStripResult } from './strip';
import { encryptEnvFile, getVaultPath } from '../crypto/vault';

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-strip-'));
}

async function createVault(dir: string, name: string, content: string, password: string) {
  process.chdir(dir);
  fs.mkdirSync(path.join(dir, '.envault'), { recursive: true });
  const encrypted = await encryptEnvFile(content, password);
  const vaultPath = getVaultPath(name);
  fs.writeFileSync(vaultPath, encrypted);
}

test('strips existing keys', async () => {
  const dir = makeTempDir();
  await createVault(dir, 'test', 'FOO=bar\nBAZ=qux\nHELLO=world\n', 'secret');
  const result = await runStrip({ vault: 'test', password: 'secret', keys: ['FOO', 'BAZ'] });
  expect(result.stripped).toEqual(['FOO', 'BAZ']);
  expect(result.notFound).toEqual([]);
});

test('reports not found keys', async () => {
  const dir = makeTempDir();
  await createVault(dir, 'test', 'FOO=bar\n', 'secret');
  const result = await runStrip({ vault: 'test', password: 'secret', keys: ['MISSING'] });
  expect(result.stripped).toEqual([]);
  expect(result.notFound).toEqual(['MISSING']);
});

test('dry run does not modify vault', async () => {
  const dir = makeTempDir();
  await createVault(dir, 'test', 'FOO=bar\n', 'secret');
  const vaultPath = getVaultPath('test');
  const before = fs.readFileSync(vaultPath);
  const result = await runStrip({ vault: 'test', password: 'secret', keys: ['FOO'], dryRun: true });
  const after = fs.readFileSync(vaultPath);
  expect(result.dryRun).toBe(true);
  expect(result.stripped).toEqual(['FOO']);
  expect(before).toEqual(after);
});

test('formatStripResult includes stripped keys', () => {
  const out = formatStripResult({ stripped: ['A', 'B'], notFound: [], outputPath: '/tmp/x.vault', dryRun: false });
  expect(out).toContain('- A');
  expect(out).toContain('- B');
});

test('formatStripResult shows dry run notice', () => {
  const out = formatStripResult({ stripped: ['X'], notFound: [], outputPath: '/tmp/x.vault', dryRun: true });
  expect(out).toContain('dry run');
});
