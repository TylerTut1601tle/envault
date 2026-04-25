import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { encryptEnvFile, getVaultPath } from '../crypto/vault';
import { runSlice, formatSliceResult } from './slice';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-slice-'));
}

const PASSWORD = 'test-password';
const ENV_CONTENT = 'FOO=bar\nBAZ=qux\nHELLO=world\n';

async function makeVault(dir: string, name = '.env'): Promise<string> {
  const envPath = path.join(dir, name);
  fs.writeFileSync(envPath, ENV_CONTENT);
  await encryptEnvFile(envPath, PASSWORD);
  return getVaultPath(envPath);
}

describe('runSlice', () => {
  it('slices specified keys from vault', async () => {
    const dir = makeTempDir();
    const vaultPath = await makeVault(dir);
    const result = await runSlice(vaultPath, { keys: ['FOO', 'HELLO'], password: PASSWORD });
    expect(result.count).toBe(2);
    expect(result.sliced['FOO']).toBe('bar');
    expect(result.sliced['HELLO']).toBe('world');
    expect(result.sliced['BAZ']).toBeUndefined();
  });

  it('writes output file when --output is provided', async () => {
    const dir = makeTempDir();
    const vaultPath = await makeVault(dir);
    const outFile = path.join(dir, 'sliced.env');
    const result = await runSlice(vaultPath, { keys: ['BAZ'], output: outFile, password: PASSWORD });
    expect(result.outputPath).toBe(outFile);
    expect(fs.existsSync(outFile)).toBe(true);
    const content = fs.readFileSync(outFile, 'utf-8');
    expect(content).toContain('BAZ=qux');
  });

  it('throws when no matching keys found', async () => {
    const dir = makeTempDir();
    const vaultPath = await makeVault(dir);
    await expect(
      runSlice(vaultPath, { keys: ['NONEXISTENT'], password: PASSWORD })
    ).rejects.toThrow('None of the specified keys');
  });

  it('throws when vault does not exist', async () => {
    await expect(
      runSlice('/tmp/nonexistent.env.vault', { keys: ['FOO'], password: PASSWORD })
    ).rejects.toThrow('Vault not found');
  });
});

describe('formatSliceResult', () => {
  it('formats result with keys and output path', () => {
    const result = { sliced: { FOO: 'bar', BAZ: 'qux' }, outputPath: '/tmp/out.env', count: 2 };
    const output = formatSliceResult(result);
    expect(output).toContain('Sliced 2 key(s)');
    expect(output).toContain('FOO=bar');
    expect(output).toContain('BAZ=qux');
    expect(output).toContain('Written to: /tmp/out.env');
  });

  it('omits output path line when not provided', () => {
    const result = { sliced: { FOO: 'bar' }, count: 1 };
    const output = formatSliceResult(result);
    expect(output).not.toContain('Written to');
  });
});
