import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { runRestore, formatRestoreResult } from './restore';
import { encryptEnvFile } from '../crypto/vault';
import { getSnapshotDir, takeSnapshot } from './snapshot';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-restore-test-'));
}

const PASSWORD = 'test-password-123';

describe('runRestore', () => {
  let tmpDir: string;
  let vaultPath: string;

  beforeEach(async () => {
    tmpDir = makeTempDir();
    vaultPath = path.join(tmpDir, 'test.vault');
    const envMap = { API_KEY: 'secret', DB_URL: 'postgres://localhost/db' };
    await encryptEnvFile(envMap, vaultPath, PASSWORD);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('restores a snapshot to an env file', async () => {
    const snapshotDir = getSnapshotDir(vaultPath);
    const snapshot = await takeSnapshot(vaultPath, snapshotDir, 'before test');

    const outputPath = path.join(tmpDir, 'restored.env');
    const result = await runRestore(vaultPath, snapshot.id, PASSWORD, outputPath);

    expect(result.success).toBe(true);
    expect(result.restoredKeys).toBe(2);
    expect(fs.existsSync(outputPath)).toBe(true);
    const content = fs.readFileSync(outputPath, 'utf-8');
    expect(content).toContain('API_KEY=secret');
    expect(content).toContain('DB_URL=postgres://localhost/db');
  });

  it('returns failure for unknown snapshot id', async () => {
    const result = await runRestore(vaultPath, 'nonexistent-id', PASSWORD);
    expect(result.success).toBe(false);
    expect(result.message).toContain('not found');
  });

  it('supports partial snapshot id prefix matching', async () => {
    const snapshotDir = getSnapshotDir(vaultPath);
    const snapshot = await takeSnapshot(vaultPath, snapshotDir, 'prefix test');
    const prefix = snapshot.id.slice(0, 8);

    const outputPath = path.join(tmpDir, 'prefix-restored.env');
    const result = await runRestore(vaultPath, prefix, PASSWORD, outputPath);

    expect(result.success).toBe(true);
    expect(result.snapshotId).toBe(snapshot.id);
  });
});

describe('formatRestoreResult', () => {
  it('formats a successful result', () => {
    const result = { success: true, snapshotId: 'abc123', targetFile: '.env', restoredKeys: 3, message: '' };
    const output = formatRestoreResult(result);
    expect(output).toContain('abc123');
    expect(output).toContain('.env');
    expect(output).toContain('3');
  });

  it('formats a failure result', () => {
    const result = { success: false, snapshotId: 'xyz', targetFile: '', restoredKeys: 0, message: 'Snapshot not found' };
    const output = formatRestoreResult(result);
    expect(output).toContain('✖');
    expect(output).toContain('Snapshot not found');
  });
});
