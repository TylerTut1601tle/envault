import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { addEnvFile, formatAddResult } from './add';
import { getVaultPath } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-add-'));
}

describe('addEnvFile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
    fs.mkdirSync(path.join(tmpDir, '.git'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('throws if env file does not exist', async () => {
    await expect(
      addEnvFile({ envFile: '.env', passphrase: 'secret', cwd: tmpDir })
    ).rejects.toThrow('Env file not found');
  });

  it('throws if passphrase is empty', async () => {
    fs.writeFileSync(path.join(tmpDir, '.env'), 'KEY=value\n');
    await expect(
      addEnvFile({ envFile: '.env', passphrase: '', cwd: tmpDir })
    ).rejects.toThrow('Passphrase must not be empty');
  });

  it('creates a vault file and gitignores the env file', async () => {
    fs.writeFileSync(path.join(tmpDir, '.env'), 'API_KEY=abc123\nDEBUG=true\n');
    const result = await addEnvFile({ envFile: '.env', passphrase: 'hunter2', cwd: tmpDir });

    expect(result.envFile).toBe('.env');
    expect(result.alreadyExists).toBe(false);
    expect(fs.existsSync(path.join(tmpDir, result.vaultFile))).toBe(true);

    const gitignore = fs.readFileSync(path.join(tmpDir, '.gitignore'), 'utf8');
    expect(gitignore).toContain('.env');
  });

  it('marks alreadyExists true when vault file is overwritten', async () => {
    fs.writeFileSync(path.join(tmpDir, '.env'), 'FOO=bar\n');
    await addEnvFile({ envFile: '.env', passphrase: 'pass1', cwd: tmpDir });
    const result = await addEnvFile({ envFile: '.env', passphrase: 'pass2', cwd: tmpDir });
    expect(result.alreadyExists).toBe(true);
  });
});

describe('formatAddResult', () => {
  it('shows Created for new vault', () => {
    const out = formatAddResult({ envFile: '.env', vaultFile: '.envault/.env.vault', alreadyExists: false });
    expect(out).toContain('Created');
    expect(out).toContain('.envault/.env.vault');
  });

  it('shows Updated for existing vault', () => {
    const out = formatAddResult({ envFile: '.env', vaultFile: '.envault/.env.vault', alreadyExists: true });
    expect(out).toContain('Updated');
  });
});
