import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach } from 'vitest';
import { encryptEnvFile } from '../crypto/vault';
import { summarizeVault, formatSummarizeResult } from './summarize';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-summarize-'));
}

const PASSWORD = 'test-password';
const SAMPLE_ENV = [
  '# App config',
  'APP_NAME=myapp',
  'APP_ENV=production',
  'APP_SECRET=',
  '# DB config',
  'DB_HOST=localhost',
  'DB_PORT=5432',
  'DB_PASS=',
].join('\n');

describe('summarizeVault', () => {
  let dir: string;

  beforeEach(async () => {
    dir = makeTempDir();
    const vaultContent = await encryptEnvFile(SAMPLE_ENV, PASSWORD);
    fs.writeFileSync(path.join(dir, '.env.vault'), vaultContent);
  });

  it('returns correct key count', async () => {
    const result = await summarizeVault('.env', PASSWORD, dir);
    expect(result.totalKeys).toBe(5);
  });

  it('counts empty values', async () => {
    const result = await summarizeVault('.env', PASSWORD, dir);
    expect(result.emptyValues).toBe(2);
  });

  it('counts comment lines', async () => {
    const result = await summarizeVault('.env', PASSWORD, dir);
    expect(result.commentLines).toBe(2);
  });

  it('extracts unique prefixes', async () => {
    const result = await summarizeVault('.env', PASSWORD, dir);
    expect(result.uniquePrefixes).toContain('APP');
    expect(result.uniquePrefixes).toContain('DB');
  });

  it('reports estimated size > 0', async () => {
    const result = await summarizeVault('.env', PASSWORD, dir);
    expect(result.estimatedSize).toBeGreaterThan(0);
  });

  it('throws if vault does not exist', async () => {
    await expect(summarizeVault('.env', PASSWORD, '/nonexistent')).rejects.toThrow('Vault not found');
  });
});

describe('formatSummarizeResult', () => {
  it('includes all expected fields', async () => {
    const dir = makeTempDir();
    const vaultContent = await encryptEnvFile(SAMPLE_ENV, PASSWORD);
    fs.writeFileSync(path.join(dir, '.env.vault'), vaultContent);
    const result = await summarizeVault('.env', PASSWORD, dir);
    const output = formatSummarizeResult(result);
    expect(output).toContain('Total keys:');
    expect(output).toContain('Empty values:');
    expect(output).toContain('Prefixes:');
    expect(output).toContain('APP');
  });
});
