import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runTouch, formatTouchResult } from './touch';
import { encryptEnvFile, decryptVaultFile, getVaultPath } from '../crypto/vault';
import { parseEnvFile } from '../env/parser';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-touch-'));
}

const PASSWORD = 'test-password-123';

describe('runTouch', () => {
  it('creates a new vault with specified keys', async () => {
    const dir = makeTempDir();
    const result = await runTouch(dir, 'test', ['API_KEY', 'DB_URL'], PASSWORD);
    expect(result.created).toBe(true);
    expect(result.keysAdded).toEqual(['API_KEY', 'DB_URL']);
    expect(fs.existsSync(result.vaultPath)).toBe(true);
  });

  it('decrypted vault contains empty values for new keys', async () => {
    const dir = makeTempDir();
    await runTouch(dir, 'test', ['FOO', 'BAR'], PASSWORD);
    const vaultPath = getVaultPath(dir, 'test');
    const decrypted = await decryptVaultFile(vaultPath, PASSWORD);
    const parsed = parseEnvFile(decrypted);
    expect(parsed['FOO']).toBe('');
    expect(parsed['BAR']).toBe('');
  });

  it('does not overwrite existing keys', async () => {
    const dir = makeTempDir();
    const vaultPath = getVaultPath(dir, 'test');
    await encryptEnvFile('EXISTING=hello\n', vaultPath, PASSWORD);
    const result = await runTouch(dir, 'test', ['EXISTING', 'NEW_KEY'], PASSWORD);
    expect(result.created).toBe(false);
    expect(result.keysAdded).toEqual(['NEW_KEY']);
    const decrypted = await decryptVaultFile(vaultPath, PASSWORD);
    const parsed = parseEnvFile(decrypted);
    expect(parsed['EXISTING']).toBe('hello');
    expect(parsed['NEW_KEY']).toBe('');
  });

  it('handles empty keys list on existing vault', async () => {
    const dir = makeTempDir();
    const vaultPath = getVaultPath(dir, 'test');
    await encryptEnvFile('A=1\n', vaultPath, PASSWORD);
    const result = await runTouch(dir, 'test', [], PASSWORD);
    expect(result.created).toBe(false);
    expect(result.keysAdded).toEqual([]);
  });
});

describe('formatTouchResult', () => {
  it('formats created result', () => {
    const output = formatTouchResult({ vaultPath: '.envault/test.vault', created: true, keysAdded: ['X'] });
    expect(output).toContain('Created new vault');
    expect(output).toContain('X');
  });

  it('formats updated result with no new keys', () => {
    const output = formatTouchResult({ vaultPath: '.envault/test.vault', created: false, keysAdded: [] });
    expect(output).toContain('Updated vault');
    expect(output).toContain('No new keys added');
  });
});
