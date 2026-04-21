import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { flattenVaults, formatFlattenResult } from './flatten';
import { encryptEnvFile } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-flatten-'));
}

const PASSWORD = 'test-password-flatten';

async function createVault(dir: string, name: string, content: string): Promise<void> {
  await encryptEnvFile(dir, name, content, PASSWORD);
}

describe('flattenVaults', () => {
  it('merges two vaults with no overlap', async () => {
    const dir = makeTempDir();
    await createVault(dir, 'base', 'FOO=bar\nBAZ=qux\n');
    await createVault(dir, 'extra', 'HELLO=world\n');

    const result = await flattenVaults(dir, ['base', 'extra'], PASSWORD);
    expect(result.keyCount).toBe(3);
    expect(result.output).toContain('FOO=bar');
    expect(result.output).toContain('BAZ=qux');
    expect(result.output).toContain('HELLO=world');
    expect(result.sourceFiles).toHaveLength(2);
  });

  it('later vault overrides earlier for duplicate keys', async () => {
    const dir = makeTempDir();
    await createVault(dir, 'base', 'FOO=original\nSHARED=base\n');
    await createVault(dir, 'override', 'SHARED=overridden\n');

    const result = await flattenVaults(dir, ['base', 'override'], PASSWORD);
    expect(result.keyCount).toBe(2);
    expect(result.output).toContain('SHARED=overridden');
    expect(result.output).not.toContain('SHARED=base');
  });

  it('throws when a vault does not exist', async () => {
    const dir = makeTempDir();
    await expect(
      flattenVaults(dir, ['nonexistent'], PASSWORD)
    ).rejects.toThrow('Vault not found: nonexistent');
  });

  it('returns empty output for empty vaults', async () => {
    const dir = makeTempDir();
    await createVault(dir, 'empty', '');

    const result = await flattenVaults(dir, ['empty'], PASSWORD);
    expect(result.keyCount).toBe(0);
    expect(result.output).toBe('');
  });
});

describe('formatFlattenResult', () => {
  it('formats result with source files and output', async () => {
    const dir = makeTempDir();
    await createVault(dir, 'a', 'KEY=val\n');

    const result = await flattenVaults(dir, ['a'], PASSWORD);
    const formatted = formatFlattenResult(result);
    expect(formatted).toContain('✔ Flattened 1 vault(s) → 1 key(s)');
    expect(formatted).toContain('KEY=val');
  });
});
