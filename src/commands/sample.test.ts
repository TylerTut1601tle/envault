import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encryptEnvFile } from '../crypto/vault';
import { runSample, formatSampleResult } from './sample';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-sample-'));
}

describe('sample command', () => {
  let dir: string;
  const password = 'test-password-123';
  const envContent = 'API_KEY=abc123\nDB_URL=postgres://localhost/db\nSECRET=topsecret\nPORT=3000\nDEBUG=true';

  beforeEach(async () => {
    dir = makeTempDir();
    await encryptEnvFile(dir, '.env', envContent, password);
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('returns a random sample of keys', async () => {
    const result = await runSample(dir, '.env', password, { count: 2 });
    expect(result.total).toBe(5);
    expect(Object.keys(result.sampled).length).toBe(2);
    expect(result.envFile).toBe('.env');
  });

  it('returns specific keys when provided', async () => {
    const result = await runSample(dir, '.env', password, { keys: ['API_KEY', 'PORT'] });
    expect(result.sampled['API_KEY']).toBe('abc123');
    expect(result.sampled['PORT']).toBe('3000');
    expect(Object.keys(result.sampled).length).toBe(2);
  });

  it('redacts values when redact option is set', async () => {
    const result = await runSample(dir, '.env', password, { keys: ['API_KEY', 'SECRET'], redact: true });
    expect(result.sampled['API_KEY']).toBe('***');
    expect(result.sampled['SECRET']).toBe('***');
  });

  it('ignores unknown keys when keys filter is provided', async () => {
    const result = await runSample(dir, '.env', password, { keys: ['API_KEY', 'NONEXISTENT'] });
    expect(Object.keys(result.sampled)).toEqual(['API_KEY']);
  });

  it('throws when vault does not exist', async () => {
    await expect(runSample(dir, '.env.missing', password)).rejects.toThrow('Vault not found');
  });

  it('formats result correctly', async () => {
    const result = await runSample(dir, '.env', password, { keys: ['DEBUG'] });
    const output = formatSampleResult(result);
    expect(output).toContain('Vault:');
    expect(output).toContain('Sampled 1 of 5 keys');
    expect(output).toContain('DEBUG=true');
  });

  it('defaults to 3 keys when count is not specified', async () => {
    const result = await runSample(dir, '.env', password);
    expect(Object.keys(result.sampled).length).toBe(3);
  });
});
