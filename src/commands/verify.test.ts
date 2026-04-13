import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encryptEnvFile } from '../crypto/vault';
import { runVerify, formatVerifyResult } from './verify';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-verify-test-'));
}

describe('runVerify', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
    // Create a minimal git repo structure
    fs.mkdirSync(path.join(tmpDir, '.git'));
    fs.mkdirSync(path.join(tmpDir, '.envault'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns invalid when vault file does not exist', async () => {
    const result = await runVerify('production', 'secret', tmpDir);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/not found/);
  });

  it('returns valid for a correctly encrypted vault', async () => {
    const envContent = 'API_KEY=abc123\nDB_URL=postgres://localhost/db\n';
    const envPath = path.join(tmpDir, '.env.production');
    fs.writeFileSync(envPath, envContent);

    await encryptEnvFile(envPath, path.join(tmpDir, '.envault', 'production.vault'), 'secret');

    const result = await runVerify('production', 'secret', tmpDir);
    expect(result.valid).toBe(true);
    expect(result.keyCount).toBe(2);
  });

  it('returns invalid when password is wrong', async () => {
    const envContent = 'FOO=bar\n';
    const envPath = path.join(tmpDir, '.env.staging');
    fs.writeFileSync(envPath, envContent);

    await encryptEnvFile(envPath, path.join(tmpDir, '.envault', 'staging.vault'), 'correct-pass');

    const result = await runVerify('staging', 'wrong-pass', tmpDir);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns invalid for a non-vault file', async () => {
    const vaultDir = path.join(tmpDir, '.envault');
    fs.writeFileSync(path.join(vaultDir, 'broken.vault'), 'not-a-vault');

    const result = await runVerify('broken', 'secret', tmpDir);
    expect(result.valid).toBe(false);
  });
});

describe('formatVerifyResult', () => {
  it('formats a valid result', () => {
    const msg = formatVerifyResult({ vaultPath: '.envault/prod.vault', valid: true, keyCount: 3 });
    expect(msg).toMatch(/✔/);
    expect(msg).toMatch(/3 keys/);
  });

  it('formats an invalid result', () => {
    const msg = formatVerifyResult({ vaultPath: '.envault/prod.vault', valid: false, error: 'bad password' });
    expect(msg).toMatch(/✘/);
    expect(msg).toMatch(/bad password/);
  });

  it('uses singular for 1 key', () => {
    const msg = formatVerifyResult({ vaultPath: '.envault/x.vault', valid: true, keyCount: 1 });
    expect(msg).toMatch(/1 key found/);
  });
});
