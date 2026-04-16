import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach } from 'vitest';
import { encryptEnvFile, getVaultPath } from '../crypto/vault';
import { runCat, formatCatResult } from './cat';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-cat-'));
}

describe('runCat', () => {
  let dir: string;
  const password = 'test-password';

  beforeEach(() => {
    dir = makeTempDir();
  });

  it('returns error when vault does not exist', async () => {
    const result = await runCat({ env: '.env', password, cwd: dir });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found/i);
  });

  it('decrypts and returns content', async () => {
    const entries = [{ key: 'FOO', value: 'bar', comment: '' }];
    const encrypted = await encryptEnvFile(entries, password);
    const vaultPath = getVaultPath(dir, '.env');
    fs.mkdirSync(path.dirname(vaultPath), { recursive: true });
    fs.writeFileSync(vaultPath, encrypted);

    const result = await runCat({ env: '.env', password, cwd: dir });
    expect(result.success).toBe(true);
    expect(result.content).toContain('FOO=bar');
  });

  it('returns error on wrong password', async () => {
    const entries = [{ key: 'FOO', value: 'bar', comment: '' }];
    const encrypted = await encryptEnvFile(entries, password);
    const vaultPath = getVaultPath(dir, '.env');
    fs.mkdirSync(path.dirname(vaultPath), { recursive: true });
    fs.writeFileSync(vaultPath, encrypted);

    const result = await runCat({ env: '.env', password: 'wrong', cwd: dir });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/decrypt/i);
  });
});

describe('formatCatResult', () => {
  it('returns content on success', () => {
    const out = formatCatResult({ success: true, content: 'FOO=bar\n' });
    expect(out).toBe('FOO=bar\n');
  });

  it('returns error message on failure', () => {
    const out = formatCatResult({ success: false, error: 'Not found' });
    expect(out).toContain('Error: Not found');
  });
});
