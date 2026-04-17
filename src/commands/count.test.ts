import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { countEnvKeys, formatCountResult } from './count';
import { encryptEnvFile, getVaultPath } from '../crypto/vault';

async function makeTempDir(): Promise<string> {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-count-'));
}

const PASSWORD = 'test-password';

async function createVault(dir: string, name: string, content: string) {
  const encrypted = await encryptEnvFile(content, PASSWORD);
  const vaultPath = getVaultPath(dir, name);
  fs.mkdirSync(path.dirname(vaultPath), { recursive: true });
  fs.writeFileSync(vaultPath, encrypted, 'utf-8');
}

test('counts set and empty keys', async () => {
  const dir = await makeTempDir();
  const content = 'FOO=bar\nBAZ=\nQUX=hello\n';
  await createVault(dir, 'test', content);

  const result = await countEnvKeys(dir, 'test', PASSWORD);
  expect(result.set).toBe(2);
  expect(result.empty).toBe(1);
  expect(result.total).toBe(3);
});

test('counts comment lines separately', async () => {
  const dir = await makeTempDir();
  const content = '# comment\nFOO=bar\n# another\nBAZ=baz\n';
  await createVault(dir, 'test', content);

  const result = await countEnvKeys(dir, 'test', PASSWORD);
  expect(result.commented).toBe(2);
  expect(result.total).toBe(2);
});

test('throws if vault does not exist', async () => {
  const dir = await makeTempDir();
  await expect(countEnvKeys(dir, 'missing', PASSWORD)).rejects.toThrow('Vault not found');
});

test('formatCountResult returns readable output', async () => {
  const result = { vault: 'prod', total: 5, empty: 1, commented: 2, set: 4 };
  const output = formatCountResult(result);
  expect(output).toContain('prod');
  expect(output).toContain('4');
  expect(output).toContain('1');
  expect(output).toContain('2');
});
