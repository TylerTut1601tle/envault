import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encryptEnvFile, getVaultPath } from '../crypto/vault';
import { validateVault, formatValidateResult } from './validate';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-validate-'));
}

describe('validateVault', () => {
  let tmpDir: string;
  const password = 'test-password';

  beforeEach(() => {
    tmpDir = makeTempDir();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns invalid for missing vault file', async () => {
    const result = await validateVault(path.join(tmpDir, '.env.vault'), password);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/not found/i);
  });

  it('returns invalid for wrong password', async () => {
    const envPath = path.join(tmpDir, '.env');
    fs.writeFileSync(envPath, 'KEY=value\n');
    await encryptEnvFile(envPath, password);
    const vaultPath = getVaultPath(envPath);
    const result = await validateVault(vaultPath, 'wrong-password');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/decryption failed/i);
  });

  it('validates successfully with no schema', async () => {
    const envPath = path.join(tmpDir, '.env');
    fs.writeFileSync(envPath, 'KEY=value\nFOO=bar\n');
    await encryptEnvFile(envPath, password);
    const vaultPath = getVaultPath(envPath);
    const result = await validateVault(vaultPath, password);
    expect(result.valid).toBe(true);
    expect(result.keyCount).toBe(2);
    expect(result.errors).toHaveLength(0);
  });

  it('detects missing keys against schema', async () => {
    const envPath = path.join(tmpDir, '.env');
    fs.writeFileSync(envPath, 'KEY=value\n');
    await encryptEnvFile(envPath, password);
    const vaultPath = getVaultPath(envPath);
    const schemaPath = path.join(tmpDir, '.env.schema');
    fs.writeFileSync(schemaPath, 'KEY=\nREQUIRED_KEY=\n');
    const result = await validateVault(vaultPath, password, schemaPath);
    expect(result.valid).toBe(false);
    expect(result.missingKeys).toContain('REQUIRED_KEY');
  });

  it('reports extra keys when schema is provided', async () => {
    const envPath = path.join(tmpDir, '.env');
    fs.writeFileSync(envPath, 'KEY=value\nEXTRA=thing\n');
    await encryptEnvFile(envPath, password);
    const vaultPath = getVaultPath(envPath);
    const schemaPath = path.join(tmpDir, '.env.schema');
    fs.writeFileSync(schemaPath, 'KEY=\n');
    const result = await validateVault(vaultPath, password, schemaPath);
    expect(result.extraKeys).toContain('EXTRA');
  });
});

describe('formatValidateResult', () => {
  it('formats a valid result', () => {
    const out = formatValidateResult({ vault: '.env.vault', valid: true, keyCount: 3, missingKeys: [], extraKeys: [], errors: [] });
    expect(out).toContain('✔ valid');
    expect(out).toContain('3 keys');
  });

  it('formats an invalid result with errors', () => {
    const out = formatValidateResult({ vault: '.env.vault', valid: false, keyCount: 0, missingKeys: ['FOO'], extraKeys: [], errors: ['Missing required keys: FOO'] });
    expect(out).toContain('✘ invalid');
    expect(out).toContain('Missing keys: FOO');
  });
});
