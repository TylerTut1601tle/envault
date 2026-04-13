import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execSync } from 'child_process';
import { pullVaults, formatPullResult } from './pull';
import { encryptEnvFile, getVaultPath } from '../crypto/vault';

function makeTempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'envault-pull-'));
  execSync('git init', { cwd: dir, stdio: 'ignore' });
  execSync('git config user.email "test@test.com"', { cwd: dir, stdio: 'ignore' });
  execSync('git config user.name "Test"', { cwd: dir, stdio: 'ignore' });
  return dir;
}

describe('pullVaults', () => {
  it('decrypts tracked vault files into .env files', async () => {
    const dir = makeTempDir();
    const envContent = 'API_KEY=secret\nDB_URL=postgres://localhost/db\n';
    const passphrase = 'test-passphrase';

    const envPath = path.join(dir, '.env');
    fs.writeFileSync(envPath, envContent);

    const vaultContent = await encryptEnvFile(envContent, passphrase);
    const vaultPath = getVaultPath(envPath);
    fs.writeFileSync(vaultPath, vaultContent);

    const vaultDir = path.join(dir, '.envault');
    fs.mkdirSync(vaultDir, { recursive: true });
    fs.writeFileSync(path.join(vaultDir, '.gitkeep'), '');
    execSync('git add .', { cwd: dir, stdio: 'ignore' });
    execSync('git commit -m "init"', { cwd: dir, stdio: 'ignore' });

    fs.unlinkSync(envPath);
    expect(fs.existsSync(envPath)).toBe(false);

    const result = await pullVaults(passphrase, dir);
    expect(result.errors).toHaveLength(0);
    expect(result.pulled.length).toBeGreaterThanOrEqual(1);
    expect(fs.existsSync(envPath)).toBe(true);
    expect(fs.readFileSync(envPath, 'utf-8')).toBe(envContent);
  });

  it('returns empty result when no vaults are tracked', async () => {
    const dir = makeTempDir();
    const vaultDir = path.join(dir, '.envault');
    fs.mkdirSync(vaultDir, { recursive: true });
    fs.writeFileSync(path.join(vaultDir, '.gitkeep'), '');
    execSync('git add .', { cwd: dir, stdio: 'ignore' });
    execSync('git commit -m "init"', { cwd: dir, stdio: 'ignore' });

    const result = await pullVaults('any-passphrase', dir);
    expect(result.pulled).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });
});

describe('formatPullResult', () => {
  it('formats successful pull', () => {
    const output = formatPullResult({ pulled: ['.env'], skipped: [], errors: [] });
    expect(output).toContain('✅');
    expect(output).toContain('.env');
  });

  it('shows no vaults message when empty', () => {
    const output = formatPullResult({ pulled: [], skipped: [], errors: [] });
    expect(output).toContain('No vaults found');
  });

  it('shows errors', () => {
    const output = formatPullResult({ pulled: [], skipped: [], errors: [{ file: 'x.vault', error: 'bad passphrase' }] });
    expect(output).toContain('❌');
    expect(output).toContain('bad passphrase');
  });
});
