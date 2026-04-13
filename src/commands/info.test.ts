import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getVaultInfo, formatInfo } from './info';
import { getVaultPath } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-info-test-'));
}

describe('getVaultInfo', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('reports envExists=false when .env is missing', () => {
    const envFile = path.join(tmpDir, '.env');
    const info = getVaultInfo(envFile, tmpDir);
    expect(info.envExists).toBe(false);
    expect(info.vaultExists).toBe(false);
  });

  it('reports envExists=true when .env is present', () => {
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'KEY=value\n');
    const info = getVaultInfo(envFile, tmpDir);
    expect(info.envExists).toBe(true);
  });

  it('reports vaultExists=true when vault file is present', () => {
    const envFile = path.join(tmpDir, '.env');
    const vaultFile = getVaultPath(envFile);
    fs.writeFileSync(vaultFile, 'encrypted-data');
    const info = getVaultInfo(envFile, tmpDir);
    expect(info.vaultExists).toBe(true);
    expect(info.lastModified).toBeInstanceOf(Date);
  });

  it('reports vaultTracked=false when vault dir has no tracked files', () => {
    const envFile = path.join(tmpDir, '.env');
    const info = getVaultInfo(envFile, tmpDir);
    expect(info.vaultTracked).toBe(false);
  });
});

describe('formatInfo', () => {
  it('includes all expected labels', () => {
    const info = {
      envFile: '/tmp/project/.env',
      vaultFile: '/tmp/project/.envault/.env.vault',
      envExists: true,
      vaultExists: false,
      vaultTracked: false,
      lastModified: null,
    };
    const output = formatInfo(info);
    expect(output).toContain('Env file');
    expect(output).toContain('Vault file');
    expect(output).toContain('Env exists');
    expect(output).toContain('Vault exists');
    expect(output).toContain('Git tracked');
  });

  it('shows last modified when vault exists', () => {
    const now = new Date();
    const info = {
      envFile: '/tmp/.env',
      vaultFile: '/tmp/.envault/.env.vault',
      envExists: true,
      vaultExists: true,
      vaultTracked: true,
      lastModified: now,
    };
    const output = formatInfo(info);
    expect(output).toContain('Last modified');
    expect(output).toContain(now.toISOString());
  });
});
