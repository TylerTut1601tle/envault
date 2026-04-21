import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encryptEnvFile } from '../crypto/vault';
import { resolveKey, formatResolveResult } from './resolve';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-resolve-'));
}

describe('resolveKey', () => {
  let tmpDir: string;
  const password = 'test-password-123';

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('resolves an existing key from a vault', async () => {
    const envContent = 'API_KEY=secret123\nDB_URL=postgres://localhost/db\n';
    await encryptEnvFile(tmpDir, '.env', envContent, password);

    const result = await resolveKey(tmpDir, '.env', 'API_KEY', password);
    expect(result.found).toBe(true);
    expect(result.value).toBe('secret123');
    expect(result.key).toBe('API_KEY');
  });

  it('returns found=false for a missing key', async () => {
    const envContent = 'ONLY_KEY=value\n';
    await encryptEnvFile(tmpDir, '.env', envContent, password);

    const result = await resolveKey(tmpDir, '.env', 'MISSING_KEY', password);
    expect(result.found).toBe(false);
    expect(result.value).toBeUndefined();
  });

  it('throws if vault file does not exist', async () => {
    await expect(
      resolveKey(tmpDir, '.env.missing', 'ANY_KEY', password)
    ).rejects.toThrow('Vault file not found');
  });

  it('throws on wrong password', async () => {
    const envContent = 'KEY=val\n';
    await encryptEnvFile(tmpDir, '.env', envContent, password);

    await expect(
      resolveKey(tmpDir, '.env', 'KEY', 'wrong-password')
    ).rejects.toThrow();
  });
});

describe('formatResolveResult', () => {
  it('returns the value when found', () => {
    const result = { key: 'FOO', value: 'bar', vaultFile: '.env.vault', found: true };
    expect(formatResolveResult(result)).toBe('bar');
  });

  it('returns not-found message when key is missing', () => {
    const result = { key: 'FOO', value: undefined, vaultFile: '.env.vault', found: false };
    expect(formatResolveResult(result)).toContain('not found');
    expect(formatResolveResult(result)).toContain('FOO');
    expect(formatResolveResult(result)).toContain('.env.vault');
  });

  it('returns empty string for empty value', () => {
    const result = { key: 'EMPTY', value: '', vaultFile: '.env.vault', found: true };
    expect(formatResolveResult(result)).toBe('');
  });
});
