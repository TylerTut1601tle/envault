import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { runRename, formatRenameResult } from './rename';
import { getVaultPath } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-rename-'));
}

describe('runRename', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
    // Create the .envault directory
    fs.mkdirSync(path.join(tmpDir, '.envault'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('renames a vault file successfully', async () => {
    const oldVault = getVaultPath('.env', tmpDir);
    fs.writeFileSync(oldVault, 'encrypted-content');

    const result = await runRename('.env', '.env.staging', tmpDir);

    expect(result.success).toBe(true);
    expect(result.oldName).toBe('.env');
    expect(result.newName).toBe('.env.staging');
    expect(fs.existsSync(oldVault)).toBe(false);
    expect(fs.existsSync(getVaultPath('.env.staging', tmpDir))).toBe(true);
  });

  it('returns error when source vault does not exist', async () => {
    const result = await runRename('.env.missing', '.env.new', tmpDir);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found/);
  });

  it('returns error when destination vault already exists', async () => {
    const oldVault = getVaultPath('.env', tmpDir);
    const newVault = getVaultPath('.env.production', tmpDir);
    fs.writeFileSync(oldVault, 'data-a');
    fs.writeFileSync(newVault, 'data-b');

    const result = await runRename('.env', '.env.production', tmpDir);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/already exists/);
  });

  it('preserves vault file contents after rename', async () => {
    const oldVault = getVaultPath('.env', tmpDir);
    const content = 'super-secret-encrypted-blob';
    fs.writeFileSync(oldVault, content);

    await runRename('.env', '.env.local', tmpDir);

    const newVault = getVaultPath('.env.local', tmpDir);
    expect(fs.readFileSync(newVault, 'utf8')).toBe(content);
  });
});

describe('formatRenameResult', () => {
  it('formats a successful rename', () => {
    const output = formatRenameResult({
      success: true,
      oldName: '.env',
      newName: '.env.staging',
      oldVaultPath: '.envault/env.vault',
      newVaultPath: '.envault/env.staging.vault',
    });
    expect(output).toContain('✓');
    expect(output).toContain('.env.staging');
  });

  it('formats a failed rename', () => {
    const output = formatRenameResult({
      success: false,
      oldName: '.env',
      newName: '.env.new',
      error: 'Vault file not found',
    });
    expect(output).toContain('✗');
    expect(output).toContain('Vault file not found');
  });
});
