import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach } from 'vitest';
import { encryptEnvFile, getVaultPath } from '../crypto/vault';
import { runHead, formatHeadResult } from './head';

function makeTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-head-'));
}

describe('head', () => {
  let tmpDir: string;
  const password = 'headtest123';

  beforeEach(async () => {
    tmpDir = makeTempDir();
    const content = ['A=1', 'B=2', 'C=3', 'D=4', 'E=5', 'F=6', 'G=7', 'H=8', 'I=9', 'J=10', 'K=11'].join('\n');
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, content);
    const encrypted = await encryptEnvFile(content, password);
    const vaultPath = getVaultPath('.env', tmpDir);
    fs.mkdirSync(path.dirname(vaultPath), { recursive: true });
    fs.writeFileSync(vaultPath, encrypted);
  });

  it('returns first 10 entries by default', async () => {
    const result = await runHead('.env', { password, cwd: tmpDir });
    expect(result.entries).toHaveLength(10);
    expect(result.entries[0]).toEqual({ key: 'A', value: '1' });
    expect(result.total).toBe(11);
  });

  it('respects lines option', async () => {
    const result = await runHead('.env', { password, lines: 3, cwd: tmpDir });
    expect(result.entries).toHaveLength(3);
    expect(result.entries[2]).toEqual({ key: 'C', value: '3' });
  });

  it('throws if vault does not exist', async () => {
    await expect(runHead('.env.missing', { password, cwd: tmpDir })).rejects.toThrow('Vault not found');
  });

  it('formats output correctly', async () => {
    const result = await runHead('.env', { password, lines: 2, cwd: tmpDir });
    const out = formatHeadResult(result, 2);
    expect(out).toContain('A=1');
    expect(out).toContain('B=2');
    expect(out).toContain('showing 2 of 11');
  });
});
