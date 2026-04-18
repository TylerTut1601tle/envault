import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runMv, formatMvResult } from './mv';
import { encryptEnvFile, getVaultPath } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-mv-'));
}

async function createVault(dir: string, name: string): Promise<void> {
  const content = 'KEY=value\n';
  await encryptEnvFile(dir, name, content, 'password');
}

describe('runMv', () => {
  it('moves a vault to a new name', async () => {
    const dir = makeTempDir();
    await createVault(dir, 'dev');
    const result = await runMv(dir, 'dev', 'staging');
    expect(result.success).toBe(true);
    expect(result.from).toBe('dev');
    expect(result.to).toBe('staging');
    expect(fs.existsSync(getVaultPath(dir, 'staging'))).toBe(true);
    expect(fs.existsSync(getVaultPath(dir, 'dev'))).toBe(false);
  });

  it('returns error if source vault does not exist', async () => {
    const dir = makeTempDir();
    const result = await runMv(dir, 'nonexistent', 'other');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found/);
  });

  it('returns error if destination vault already exists', async () => {
    const dir = makeTempDir();
    await createVault(dir, 'dev');
    await createVault(dir, 'staging');
    const result = await runMv(dir, 'dev', 'staging');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/already exists/);
  });
});

describe('formatMvResult', () => {
  it('formats success', () => {
    const msg = formatMvResult({ success: true, from: 'dev', to: 'staging' });
    expect(msg).toContain('dev');
    expect(msg).toContain('staging');
  });

  it('formats error', () => {
    const msg = formatMvResult({ success: false, from: 'dev', to: 'staging', error: 'not found' });
    expect(msg).toContain('Error');
  });
});
