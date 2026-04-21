import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runSort, formatSortResult } from './sort';
import { encryptEnvFile } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-sort-'));
}

const PASSWORD = 'test-password';

async function createVault(dir: string, content: string): Promise<string> {
  const envFile = path.join(dir, '.env');
  await encryptEnvFile(envFile, content, PASSWORD);
  return envFile;
}

describe('runSort', () => {
  it('sorts keys alphabetically', async () => {
    const dir = makeTempDir();
    const envFile = await createVault(dir, 'ZEBRA=1\nAPPLE=2\nMIDDLE=3\n');
    const result = await runSort(envFile, PASSWORD);
    expect(result.changed).toBe(true);
    expect(result.keyCount).toBe(3);
  });

  it('returns changed=false when already sorted', async () => {
    const dir = makeTempDir();
    const envFile = await createVault(dir, 'ALPHA=1\nBETA=2\nGAMMA=3\n');
    const result = await runSort(envFile, PASSWORD);
    expect(result.changed).toBe(false);
    expect(result.keyCount).toBe(3);
  });

  it('sorts in reverse order', async () => {
    const dir = makeTempDir();
    const envFile = await createVault(dir, 'ALPHA=1\nBETA=2\nGAMMA=3\n');
    const result = await runSort(envFile, PASSWORD, { reverse: true });
    expect(result.changed).toBe(true);
  });

  it('throws if vault does not exist', async () => {
    const dir = makeTempDir();
    await expect(
      runSort(path.join(dir, '.env'), PASSWORD)
    ).rejects.toThrow('Vault file not found');
  });

  it('handles single key without error', async () => {
    const dir = makeTempDir();
    const envFile = await createVault(dir, 'ONLY=value\n');
    const result = await runSort(envFile, PASSWORD);
    expect(result.keyCount).toBe(1);
    expect(result.changed).toBe(false);
  });
});

describe('formatSortResult', () => {
  it('shows sorted message when changed', () => {
    const msg = formatSortResult({ vaultPath: '.env.vault', keyCount: 5, changed: true });
    expect(msg).toContain('Sorted');
    expect(msg).toContain('5 keys');
  });

  it('shows already sorted message when not changed', () => {
    const msg = formatSortResult({ vaultPath: '.env.vault', keyCount: 3, changed: false });
    expect(msg).toContain('already sorted');
    expect(msg).toContain('3 keys');
  });
});
