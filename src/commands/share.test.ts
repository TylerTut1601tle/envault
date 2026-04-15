import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encryptEnvFile } from '../crypto/vault';
import { runShare, formatShareResult } from './share';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-share-'));
}

describe('runShare', () => {
  let dir: string;
  const password = 'sharepassword';
  const vaultName = 'staging';

  beforeEach(async () => {
    dir = makeTempDir();
    const vaultDir = path.join(dir, '.envault');
    fs.mkdirSync(vaultDir, { recursive: true });
    await encryptEnvFile(path.join(vaultDir, `${vaultName}.vault`), { API_KEY: 'abc123', NODE_ENV: 'staging' }, password);
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('exports a decrypted .env file to the default output path', async () => {
    const result = await runShare(dir, vaultName, password);
    expect(result.success).toBe(true);
    expect(result.vaultName).toBe(vaultName);
    expect(fs.existsSync(result.outputPath)).toBe(true);
    const content = fs.readFileSync(result.outputPath, 'utf-8');
    expect(content).toContain('API_KEY=abc123');
    expect(content).toContain('NODE_ENV=staging');
  });

  it('exports to a custom output path when specified', async () => {
    const customOut = path.join(dir, 'custom-output.env');
    const result = await runShare(dir, vaultName, password, customOut);
    expect(result.success).toBe(true);
    expect(result.outputPath).toBe(customOut);
    expect(fs.existsSync(customOut)).toBe(true);
  });

  it('returns failure when vault does not exist', async () => {
    const result = await runShare(dir, 'nonexistent', password);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found/);
  });

  it('returns failure when password is wrong', async () => {
    const result = await runShare(dir, vaultName, 'wrongpassword');
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Decryption failed/);
  });

  it('masks the key hint correctly', async () => {
    const result = await runShare(dir, vaultName, password);
    expect(result.keyHint).toMatch(/^sh\*+rd$/);
  });
});

describe('formatShareResult', () => {
  it('formats a success result', () => {
    const out = formatShareResult({ success: true, vaultName: 'prod', outputPath: '/tmp/prod.shared.env', keyHint: 'pa**rd' });
    expect(out).toContain('✅');
    expect(out).toContain('prod');
    expect(out).toContain('/tmp/prod.shared.env');
  });

  it('formats a failure result', () => {
    const out = formatShareResult({ success: false, vaultName: 'prod', outputPath: '', keyHint: '', error: 'Vault not found' });
    expect(out).toContain('❌');
    expect(out).toContain('Vault not found');
  });
});
