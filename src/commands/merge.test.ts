import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encryptEnvFile, decryptVaultFile, getVaultPath } from '../crypto/vault';
import { runMerge, formatMergeResult } from './merge';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-merge-'));
}

describe('runMerge', () => {
  let tmpDir: string;
  const password = 'test-password-123';

  beforeEach(() => {
    tmpDir = makeTempDir();
    process.chdir(tmpDir);
    fs.mkdirSync(path.join(tmpDir, '.envault'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('adds new keys from source .env into target vault', async () => {
    const targetContent = 'EXISTING=value1\n';
    const targetVaultPath = getVaultPath('production');
    await encryptEnvFile(targetContent, targetVaultPath, password);

    const sourceEnv = path.join(tmpDir, '.env.staging');
    fs.writeFileSync(sourceEnv, 'NEW_KEY=hello\nANOTHER=world\n');

    const result = await runMerge(sourceEnv, 'production', password);
    expect(result.added).toContain('NEW_KEY');
    expect(result.added).toContain('ANOTHER');
    expect(result.skipped).toHaveLength(0);
    expect(result.updated).toHaveLength(0);

    const merged = await decryptVaultFile(targetVaultPath, password);
    const keys = merged.filter((e) => e.key).map((e) => e.key);
    expect(keys).toContain('EXISTING');
    expect(keys).toContain('NEW_KEY');
  });

  it('skips conflicting keys without --overwrite', async () => {
    const targetContent = 'SHARED=original\n';
    const targetVaultPath = getVaultPath('staging');
    await encryptEnvFile(targetContent, targetVaultPath, password);

    const sourceEnv = path.join(tmpDir, '.env.other');
    fs.writeFileSync(sourceEnv, 'SHARED=override\nFRESH=yes\n');

    const result = await runMerge(sourceEnv, 'staging', password, false);
    expect(result.skipped).toContain('SHARED');
    expect(result.added).toContain('FRESH');

    const merged = await decryptVaultFile(targetVaultPath, password);
    const shared = merged.find((e) => e.key === 'SHARED');
    expect(shared?.value).toBe('original');
  });

  it('updates conflicting keys with --overwrite', async () => {
    const targetContent = 'SHARED=original\n';
    const targetVaultPath = getVaultPath('dev');
    await encryptEnvFile(targetContent, targetVaultPath, password);

    const sourceEnv = path.join(tmpDir, '.env.new');
    fs.writeFileSync(sourceEnv, 'SHARED=updated\n');

    const result = await runMerge(sourceEnv, 'dev', password, true);
    expect(result.updated).toContain('SHARED');

    const merged = await decryptVaultFile(targetVaultPath, password);
    const shared = merged.find((e) => e.key === 'SHARED');
    expect(shared?.value).toBe('updated');
  });

  it('throws when target vault does not exist', async () => {
    const sourceEnv = path.join(tmpDir, '.env');
    fs.writeFileSync(sourceEnv, 'KEY=val\n');
    await expect(runMerge(sourceEnv, 'nonexistent', password)).rejects.toThrow(
      'Target vault not found'
    );
  });
});

describe('formatMergeResult', () => {
  it('formats a result with all categories', () => {
    const output = formatMergeResult({
      added: ['A'],
      updated: ['B'],
      skipped: ['C'],
      outputVault: '.envault/production.vault',
    });
    expect(output).toContain('Added');
    expect(output).toContain('Updated');
    expect(output).toContain('Skipped');
  });

  it('shows no changes message when nothing applied', () => {
    const output = formatMergeResult({
      added: [],
      updated: [],
      skipped: ['X'],
      outputVault: '.envault/dev.vault',
    });
    expect(output).toContain('No changes applied');
  });
});
