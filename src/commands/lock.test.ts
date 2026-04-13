import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { lockEnvFile } from './lock';
import { unlockVaultFile } from './unlock';

const PASSPHRASE = 'test-passphrase-123';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-lock-test-'));
}

describe('lockEnvFile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates a vault file from an env file', async () => {
    const envPath = path.join(tmpDir, '.env');
    fs.writeFileSync(envPath, 'KEY=value\nSECRET=abc123\n');

    const result = await lockEnvFile({ envFile: envPath, passphrase: PASSPHRASE });

    expect(fs.existsSync(result.vaultPath)).toBe(true);
    expect(result.vaultPath.endsWith('.vault')).toBe(true);
    expect(result.removedOriginal).toBe(false);
    expect(fs.existsSync(envPath)).toBe(true);
  });

  it('removes original when removeOriginal is true', async () => {
    const envPath = path.join(tmpDir, '.env');
    fs.writeFileSync(envPath, 'KEY=value\n');

    const result = await lockEnvFile({
      envFile: envPath,
      passphrase: PASSPHRASE,
      removeOriginal: true,
    });

    expect(result.removedOriginal).toBe(true);
    expect(fs.existsSync(envPath)).toBe(false);
    expect(fs.existsSync(result.vaultPath)).toBe(true);
  });

  it('throws if env file does not exist', async () => {
    await expect(
      lockEnvFile({ envFile: path.join(tmpDir, 'missing.env'), passphrase: PASSPHRASE })
    ).rejects.toThrow('Env file not found');
  });

  it('throws if vault already exists', async () => {
    const envPath = path.join(tmpDir, '.env');
    fs.writeFileSync(envPath, 'KEY=value\n');
    await lockEnvFile({ envFile: envPath, passphrase: PASSPHRASE });

    await expect(
      lockEnvFile({ envFile: envPath, passphrase: PASSPHRASE })
    ).rejects.toThrow('Vault file already exists');
  });
});
