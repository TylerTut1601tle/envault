import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execSync } from 'child_process';
import { listVaults, formatList } from './list';
import { encryptEnvFile } from '../crypto/vault';
import { ensureVaultDirTracked } from '../git/secrets';

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-list-'));
  execSync('git init', { cwd: dir });
  execSync('git config user.email "test@test.com"', { cwd: dir });
  execSync('git config user.name "Test"', { cwd: dir });
  return dir;
}

describe('listVaults', () => {
  const passphrase = 'test-passphrase';

  it('throws when not in a git repo', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-nogit-'));
    await expect(listVaults({ cwd: dir })).rejects.toThrow('Not inside a Git repository');
  });

  it('returns empty array when no vaults tracked', async () => {
    const dir = makeTempDir();
    const result = await listVaults({ cwd: dir });
    expect(result).toEqual([]);
  });

  it('returns status for each tracked vault', async () => {
    const dir = makeTempDir();
    const envPath = path.join(dir, '.env');
    fs.writeFileSync(envPath, 'KEY=value\n');
    await encryptEnvFile(envPath, passphrase);
    await ensureVaultDirTracked(dir, dir);

    const vaultPath = envPath + '.vault';
    execSync(`git add ${vaultPath}`, { cwd: dir });
    execSync('git commit -m "add vault"', { cwd: dir });

    const result = await listVaults({ cwd: dir });
    expect(result.length).toBe(1);
    expect(result[0].vaultExists).toBe(true);
  });
});

describe('formatList', () => {
  it('returns message when no vaults', () => {
    const output = formatList([]);
    expect(output).toContain('No vaults are currently tracked');
  });

  it('formats vault list with sync status', () => {
    const fakeStatus = [
      {
        envFile: '/repo/.env',
        vaultFile: '/repo/.env.vault',
        envExists: true,
        vaultExists: true,
        isTracked: true,
        inSync: true,
      },
    ];
    const output = formatList(fakeStatus);
    expect(output).toContain('Tracked vaults:');
    expect(output).toContain('/repo/.env.vault');
    expect(output).toContain('in sync');
  });
});
