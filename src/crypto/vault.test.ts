import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, readFileSync, existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  encryptEnvFile,
  decryptVaultFile,
  getVaultPath,
  isVaultFile,
  VAULT_EXTENSION,
} from './vault';

const TMP = tmpdir();
const ENV_FILE = join(TMP, 'test.env');
const VAULT_FILE = join(TMP, 'test.env.vault');
const PASSPHRASE = 'test-passphrase-123';
const ENV_CONTENT = 'DB_HOST=localhost\nDB_PORT=5432\nSECRET=abc';

beforeEach(() => {
  writeFileSync(ENV_FILE, ENV_CONTENT, 'utf8');
});

afterEach(() => {
  [ENV_FILE, VAULT_FILE].forEach((f) => {
    if (existsSync(f)) unlinkSync(f);
  });
});

describe('getVaultPath', () => {
  it('should append vault extension to env file path', () => {
    expect(getVaultPath('.env')).toBe(`.env${VAULT_EXTENSION}`);
    expect(getVaultPath('/project/.env.local')).toBe(`/project/.env.local${VAULT_EXTENSION}`);
  });
});

describe('isVaultFile', () => {
  it('should return true for vault files', () => {
    expect(isVaultFile('.env.vault')).toBe(true);
  });

  it('should return false for non-vault files', () => {
    expect(isVaultFile('.env')).toBe(false);
    expect(isVaultFile('.env.local')).toBe(false);
  });
});

describe('encryptEnvFile', () => {
  it('should create an encrypted vault file', () => {
    encryptEnvFile(ENV_FILE, VAULT_FILE, { passphrase: PASSPHRASE });
    expect(existsSync(VAULT_FILE)).toBe(true);
    const content = readFileSync(VAULT_FILE, 'utf8');
    expect(content).not.toBe(ENV_CONTENT);
    expect(content.length).toBeGreaterThan(0);
  });

  it('should throw if env file does not exist', () => {
    expect(() =>
      encryptEnvFile('/nonexistent/.env', VAULT_FILE, { passphrase: PASSPHRASE })
    ).toThrow('Env file not found');
  });
});

describe('decryptVaultFile', () => {
  it('should restore original env file from vault', () => {
    encryptEnvFile(ENV_FILE, VAULT_FILE, { passphrase: PASSPHRASE });
    unlinkSync(ENV_FILE);
    decryptVaultFile(VAULT_FILE, ENV_FILE, { passphrase: PASSPHRASE });
    const restored = readFileSync(ENV_FILE, 'utf8');
    expect(restored).toBe(ENV_CONTENT);
  });

  it('should throw if vault file does not exist', () => {
    expect(() =>
      decryptVaultFile('/nonexistent/.env.vault', ENV_FILE, { passphrase: PASSPHRASE })
    ).toThrow('Vault file not found');
  });
});
