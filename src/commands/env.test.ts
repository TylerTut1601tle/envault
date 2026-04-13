import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encryptEnvFile, getVaultPath } from '../crypto/vault';
import { loadEnvVars, formatEnvResult } from './env';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-env-test-'));
}

describe('loadEnvVars', () => {
  let tmpDir: string;
  const password = 'test-password';
  const envName = '.env';
  const envContent = 'API_KEY=abc123\nDB_URL=postgres://localhost/mydb\n';

  beforeEach(async () => {
    tmpDir = makeTempDir();
    const vaultDir = path.join(tmpDir, '.envault');
    fs.mkdirSync(vaultDir, { recursive: true });
    const vaultFile = getVaultPath(tmpDir, envName);
    await encryptEnvFile(envContent, vaultFile, password);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('loads and decrypts env vars from vault', async () => {
    const result = await loadEnvVars(tmpDir, envName, password);
    expect(result.vars['API_KEY']).toBe('abc123');
    expect(result.vars['DB_URL']).toBe('postgres://localhost/mydb');
    expect(result.envName).toBe(envName);
  });

  it('throws if vault does not exist', async () => {
    await expect(loadEnvVars(tmpDir, '.env.missing', password)).rejects.toThrow('Vault not found');
  });

  it('throws if password is wrong', async () => {
    await expect(loadEnvVars(tmpDir, envName, 'wrong-password')).rejects.toThrow();
  });
});

describe('formatEnvResult', () => {
  const vars = { API_KEY: 'abc123', DB_URL: 'postgres://localhost/mydb' };
  const baseResult = { vars, vaultFile: '/fake/.envault/.env.vault', envName: '.env' };

  it('formats as export shell statements', () => {
    const out = formatEnvResult(baseResult, 'export');
    expect(out.success).toBe(true);
    expect(out.message).toContain('export API_KEY="abc123"');
    expect(out.message).toContain('export DB_URL="postgres://localhost/mydb"');
  });

  it('formats as dotenv lines', () => {
    const out = formatEnvResult(baseResult, 'dotenv');
    expect(out.message).toContain('API_KEY=abc123');
    expect(out.message).toContain('DB_URL=postgres://localhost/mydb');
  });

  it('formats as JSON', () => {
    const out = formatEnvResult(baseResult, 'json');
    const parsed = JSON.parse(out.message);
    expect(parsed.API_KEY).toBe('abc123');
    expect(parsed.DB_URL).toBe('postgres://localhost/mydb');
  });

  it('handles empty vars gracefully', () => {
    const out = formatEnvResult({ ...baseResult, vars: {} }, 'export');
    expect(out.success).toBe(true);
    expect(out.message).toContain('No variables found');
  });
});
