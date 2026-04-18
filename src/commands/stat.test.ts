import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { getVaultStat, formatStatResult } from './stat';
import { encryptEnvFile } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-stat-'));
}

const PASSWORD = 'test-password';
const ENV_CONTENT = 'FOO=bar\nBAZ=qux\n';

describe('getVaultStat', () => {
  it('returns exists=false for missing vault', async () => {
    const dir = makeTempDir();
    const stat = await getVaultStat(dir, 'missing', PASSWORD);
    expect(stat.exists).toBe(false);
    expect(stat.keyCount).toBe(0);
  });

  it('returns correct stats for existing vault', async () => {
    const dir = makeTempDir();
    const envPath = path.join(dir, '.env.test');
    fs.writeFileSync(envPath, ENV_CONTENT);
    await encryptEnvFile(envPath, PASSWORD);
    const stat = await getVaultStat(dir, 'test', PASSWORD);
    expect(stat.exists).toBe(true);
    expect(stat.keyCount).toBe(2);
    expect(stat.sizeBytes).toBeGreaterThan(0);
    expect(stat.modifiedAt).toBeInstanceOf(Date);
  });

  it('returns keyCount=-1 on wrong password', async () => {
    const dir = makeTempDir();
    const envPath = path.join(dir, '.env.test');
    fs.writeFileSync(envPath, ENV_CONTENT);
    await encryptEnvFile(envPath, PASSWORD);
    const stat = await getVaultStat(dir, 'test', 'wrong-password');
    expect(stat.exists).toBe(true);
    expect(stat.keyCount).toBe(-1);
  });
});

describe('formatStatResult', () => {
  it('shows not found message for missing vault', () => {
    const result = formatStatResult({ vaultPath: '/some/path', exists: false, sizeBytes: 0, keyCount: 0, createdAt: null, modifiedAt: null });
    expect(result).toContain('not found');
  });

  it('formats stat output with all fields', () => {
    const now = new Date();
    const result = formatStatResult({ vaultPath: '/some/path', exists: true, sizeBytes: 512, keyCount: 3, createdAt: now, modifiedAt: now });
    expect(result).toContain('512 bytes');
    expect(result).toContain('3');
  });
});
