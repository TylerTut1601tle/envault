import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execSync } from 'child_process';
import { pushCommand, formatPushResult } from './push';
import { encryptEnvFile } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-push-'));
}

function initGitRepo(dir: string): void {
  execSync('git init', { cwd: dir, stdio: 'ignore' });
  execSync('git config user.email "test@test.com"', { cwd: dir, stdio: 'ignore' });
  execSync('git config user.name "Test"', { cwd: dir, stdio: 'ignore' });
}

const PASSPHRASE = 'test-passphrase-123';
const ENV_CONTENT = 'API_KEY=abc123\nDB_URL=postgres://localhost/test\n';

describe('pushCommand', () => {
  it('returns error when not in a git repo', async () => {
    const dir = makeTempDir();
    fs.writeFileSync(path.join(dir, '.env'), ENV_CONTENT);
    const result = await pushCommand('.env', { cwd: dir });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/git repository/i);
  });

  it('returns error when env file does not exist', async () => {
    const dir = makeTempDir();
    initGitRepo(dir);
    const result = await pushCommand('.env.missing', { cwd: dir });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found/i);
  });

  it('returns error when vault does not exist', async () => {
    const dir = makeTempDir();
    initGitRepo(dir);
    fs.writeFileSync(path.join(dir, '.env'), ENV_CONTENT);
    const result = await pushCommand('.env', { cwd: dir });
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/lock/i);
  });

  it('succeeds when vault exists', async () => {
    const dir = makeTempDir();
    initGitRepo(dir);
    const envFile = path.join(dir, '.env');
    fs.writeFileSync(envFile, ENV_CONTENT);
    await encryptEnvFile(envFile, PASSPHRASE);
    const result = await pushCommand('.env', { cwd: dir });
    expect(result.success).toBe(true);
    expect(result.vaultPath).toMatch(/\.vault\.enc$/);
  });
});

describe('formatPushResult', () => {
  it('formats error result', () => {
    const out = formatPushResult({ success: false, error: 'Something went wrong' });
    expect(out).toMatch(/failed/);
    expect(out).toMatch(/Something went wrong/);
  });

  it('formats already tracked result', () => {
    const out = formatPushResult({ success: true, vaultPath: '.envault/.env.vault.enc', alreadyTracked: true });
    expect(out).toMatch(/already tracked/);
  });

  it('formats new tracking result', () => {
    const out = formatPushResult({ success: true, vaultPath: '.envault/.env.vault.enc', envFile: '.env' });
    expect(out).toMatch(/registered/);
    expect(out).toMatch(/Commit/);
  });
});
