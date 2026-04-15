import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getSnapshotPath,
  readSnapshots,
  writeSnapshots,
  takeSnapshot,
  formatSnapshotResult,
  SnapshotEntry,
} from './snapshot';
import { encryptEnvFile } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-snapshot-'));
}

describe('snapshot', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
    fs.mkdirSync(path.join(tmpDir, '.envault'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns empty array when no snapshots exist', () => {
    const result = readSnapshots(tmpDir, 'dev');
    expect(result).toEqual([]);
  });

  it('writes and reads snapshots', () => {
    const entries: SnapshotEntry[] = [
      { timestamp: '2024-01-01T00:00:00.000Z', content: 'KEY=value', label: 'initial' },
    ];
    writeSnapshots(tmpDir, 'dev', entries);
    const result = readSnapshots(tmpDir, 'dev');
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe('initial');
    expect(result[0].content).toBe('KEY=value');
  });

  it('takes a snapshot of an existing vault', () => {
    const password = 'test-pass';
    const vaultDir = path.join(tmpDir, '.envault', 'vaults');
    fs.mkdirSync(vaultDir, { recursive: true });
    const envPath = path.join(tmpDir, '.env.dev');
    fs.writeFileSync(envPath, 'API_KEY=secret\nDEBUG=true\n');
    encryptEnvFile(envPath, path.join(vaultDir, 'dev.vault'), password);

    const entry = takeSnapshot(tmpDir, 'dev', password, 'before-release');
    expect(entry.label).toBe('before-release');
    expect(entry.content).toContain('API_KEY=secret');
    expect(entry.timestamp).toBeTruthy();

    const all = readSnapshots(tmpDir, 'dev');
    expect(all).toHaveLength(1);
  });

  it('throws if vault does not exist', () => {
    expect(() => takeSnapshot(tmpDir, 'missing', 'pass')).toThrow('Vault not found');
  });

  it('formats snapshot results correctly', () => {
    expect(formatSnapshotResult('taken', 'dev', 'my-label')).toContain('Snapshot taken');
    expect(formatSnapshotResult('taken', 'dev', 'my-label')).toContain('my-label');
    expect(formatSnapshotResult('restored', 'dev', '2024-01-01')).toContain('restored from snapshot');
    expect(formatSnapshotResult('listed', 'dev')).toContain('No snapshots');
  });

  it('getSnapshotPath returns correct path', () => {
    const p = getSnapshotPath(tmpDir, 'staging');
    expect(p).toContain('snapshots');
    expect(p).toContain('staging.snapshots.json');
  });
});
