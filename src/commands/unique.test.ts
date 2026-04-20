import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { getUniqueKeys, formatUniqueResult } from './unique';
import { encryptEnvFile } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-unique-'));
}

const PASSWORD = 'test-password';

async function makeVault(dir: string, name: string, content: string): Promise<void> {
  const envPath = path.join(dir, '.env.tmp');
  fs.writeFileSync(envPath, content);
  await encryptEnvFile(envPath, path.join(dir, `.envault/${name}.vault`), PASSWORD);
  fs.mkdirSync(path.join(dir, '.envault'), { recursive: true });
  await encryptEnvFile(envPath, path.join(dir, `.envault/${name}.vault`), PASSWORD);
  fs.unlinkSync(envPath);
}

describe('getUniqueKeys', () => {
  it('returns unique keys when no duplicates exist', async () => {
    const dir = makeTempDir();
    fs.mkdirSync(path.join(dir, '.envault'), { recursive: true });
    const envPath = path.join(dir, '.env.tmp');
    fs.writeFileSync(envPath, 'FOO=1\nBAR=2\nBAZ=3\n');
    await encryptEnvFile(envPath, path.join(dir, '.envault/dev.vault'), PASSWORD);
    fs.unlinkSync(envPath);

    const result = await getUniqueKeys(dir, 'dev', PASSWORD);
    expect(result.uniqueKeys).toEqual(['BAR', 'BAZ', 'FOO']);
    expect(result.duplicateKeys).toEqual([]);
    expect(result.totalKeys).toBe(3);
  });

  it('throws if vault does not exist', async () => {
    const dir = makeTempDir();
    fs.mkdirSync(path.join(dir, '.envault'), { recursive: true });
    await expect(getUniqueKeys(dir, 'missing', PASSWORD)).rejects.toThrow('Vault not found');
  });

  it('throws on wrong password', async () => {
    const dir = makeTempDir();
    fs.mkdirSync(path.join(dir, '.envault'), { recursive: true });
    const envPath = path.join(dir, '.env.tmp');
    fs.writeFileSync(envPath, 'KEY=value\n');
    await encryptEnvFile(envPath, path.join(dir, '.envault/dev.vault'), PASSWORD);
    fs.unlinkSync(envPath);

    await expect(getUniqueKeys(dir, 'dev', 'wrong-password')).rejects.toThrow();
  });
});

describe('formatUniqueResult', () => {
  it('formats result with no duplicates', () => {
    const result = {
      vault: 'dev',
      totalKeys: 2,
      uniqueKeys: ['BAR', 'FOO'],
      duplicateKeys: [],
    };
    const output = formatUniqueResult(result);
    expect(output).toContain('Vault: dev');
    expect(output).toContain('Total keys: 2');
    expect(output).toContain('No duplicate keys found.');
    expect(output).toContain('- FOO');
    expect(output).toContain('- BAR');
  });

  it('formats result with duplicates', () => {
    const result = {
      vault: 'prod',
      totalKeys: 2,
      uniqueKeys: ['BAR'],
      duplicateKeys: ['FOO'],
    };
    const output = formatUniqueResult(result);
    expect(output).toContain('! FOO');
    expect(output).toContain('Duplicate keys (1):');
  });
});
