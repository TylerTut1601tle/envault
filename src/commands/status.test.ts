import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { getStatus, formatStatus } from './status';
import { encryptEnvFile } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-status-'));
}

describe('getStatus', () => {
  const passphrase = 'test-passphrase';

  it('reports missing env and vault files', async () => {
    const dir = makeTempDir();
    const envPath = path.join(dir, '.env');
    const status = await getStatus(envPath);

    expect(status.envExists).toBe(false);
    expect(status.vaultExists).toBe(false);
    expect(status.inSync).toBeNull();
  });

  it('reports env exists but vault missing', async () => {
    const dir = makeTempDir();
    const envPath = path.join(dir, '.env');
    fs.writeFileSync(envPath, 'KEY=value\n');

    const status = await getStatus(envPath);
    expect(status.envExists).toBe(true);
    expect(status.vaultExists).toBe(false);
    expect(status.inSync).toBeNull();
  });

  it('reports vault exists but env missing', async () => {
    const dir = makeTempDir();
    const envPath = path.join(dir, '.env');
    fs.writeFileSync(envPath, 'KEY=value\n');
    await encryptEnvFile(envPath, passphrase);
    fs.unlinkSync(envPath);

    const status = await getStatus(envPath);
    expect(status.envExists).toBe(false);
    expect(status.vaultExists).toBe(true);
    expect(status.inSync).toBeNull();
  });

  it('reports in-sync when vault is newer than env', async () => {
    const dir = makeTempDir();
    const envPath = path.join(dir, '.env');
    fs.writeFileSync(envPath, 'KEY=value\n');
    await encryptEnvFile(envPath, passphrase);

    const status = await getStatus(envPath);
    expect(status.envExists).toBe(true);
    expect(status.vaultExists).toBe(true);
    expect(status.inSync).toBe(true);
  });
});

describe('formatStatus', () => {
  it('formats status output correctly', async () => {
    const dir = makeTempDir();
    const envPath = path.join(dir, '.env');
    fs.writeFileSync(envPath, 'KEY=value\n');
    const status = await getStatus(envPath);
    const output = formatStatus(status);

    expect(output).toContain('Env file:');
    expect(output).toContain('Vault file:');
    expect(output).toContain('Env exists:');
    expect(output).toContain('Vault exists:');
    expect(output).toContain('Git tracked:');
    expect(output).toContain('In sync:');
  });
});
