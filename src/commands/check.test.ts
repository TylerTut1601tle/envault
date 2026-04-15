import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runCheck, formatCheckResult } from './check';
import { encryptEnvFile } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-check-'));
}

const PASSWORD = 'test-password-123';

async function makeVault(dir: string, content: string, name = '.env.vault'): Promise<string> {
  const envPath = path.join(dir, '.env.tmp');
  const vaultPath = path.join(dir, name);
  fs.writeFileSync(envPath, content);
  await encryptEnvFile(envPath, vaultPath, PASSWORD);
  fs.unlinkSync(envPath);
  return vaultPath;
}

describe('runCheck', () => {
  it('returns error when vault does not exist', async () => {
    const dir = makeTempDir();
    const result = await runCheck(path.join(dir, 'missing.vault'), PASSWORD);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/not found/);
  });

  it('returns error on wrong password', async () => {
    const dir = makeTempDir();
    const vaultPath = await makeVault(dir, 'FOO=bar\n');
    const result = await runCheck(vaultPath, 'wrong-password');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('returns valid result with key count when no reference file', async () => {
    const dir = makeTempDir();
    const vaultPath = await makeVault(dir, 'FOO=bar\nBAZ=qux\n');
    const result = await runCheck(vaultPath, PASSWORD);
    expect(result.valid).toBe(true);
    expect(result.keyCount).toBe(2);
    expect(result.missingKeys).toHaveLength(0);
    expect(result.extraKeys).toHaveLength(0);
  });

  it('detects missing keys against reference file', async () => {
    const dir = makeTempDir();
    const vaultPath = await makeVault(dir, 'FOO=bar\n');
    const refPath = path.join(dir, '.env.example');
    fs.writeFileSync(refPath, 'FOO=\nBAR=\nBAZ=\n');
    const result = await runCheck(vaultPath, PASSWORD, refPath);
    expect(result.valid).toBe(false);
    expect(result.missingKeys).toEqual(expect.arrayContaining(['BAR', 'BAZ']));
  });

  it('detects extra keys not in reference file', async () => {
    const dir = makeTempDir();
    const vaultPath = await makeVault(dir, 'FOO=bar\nEXTRA=yes\n');
    const refPath = path.join(dir, '.env.example');
    fs.writeFileSync(refPath, 'FOO=\n');
    const result = await runCheck(vaultPath, PASSWORD, refPath);
    expect(result.valid).toBe(true);
    expect(result.extraKeys).toContain('EXTRA');
  });

  it('returns valid when vault matches reference exactly', async () => {
    const dir = makeTempDir();
    const vaultPath = await makeVault(dir, 'FOO=bar\nBAR=baz\n');
    const refPath = path.join(dir, '.env.example');
    fs.writeFileSync(refPath, 'FOO=\nBAR=\n');
    const result = await runCheck(vaultPath, PASSWORD, refPath);
    expect(result.valid).toBe(true);
    expect(result.missingKeys).toHaveLength(0);
  });
});

describe('formatCheckResult', () => {
  it('formats error result', () => {
    const out = formatCheckResult({ vault: 'test.vault', valid: false, keyCount: 0, missingKeys: [], extraKeys: [], error: 'Decryption failed' });
    expect(out).toContain('✗');
    expect(out).toContain('Decryption failed');
  });

  it('formats valid result', () => {
    const out = formatCheckResult({ vault: 'test.vault', valid: true, keyCount: 3, missingKeys: [], extraKeys: [] });
    expect(out).toContain('✓');
    expect(out).toContain('3 keys');
  });
});
