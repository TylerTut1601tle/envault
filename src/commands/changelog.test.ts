import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  getChangelogPath,
  readChangelog,
  writeChangelog,
  appendChangelogEntry,
  formatChangelogResult,
} from './changelog';

export function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-changelog-test-'));
}

describe('changelog', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('getChangelogPath returns correct path', () => {
    const vaultPath = path.join(tmpDir, 'staging.env.vault');
    const result = getChangelogPath(vaultPath);
    expect(result).toBe(path.join(tmpDir, 'staging.env.changelog.json'));
  });

  it('readChangelog returns empty array when file does not exist', async () => {
    const vaultPath = path.join(tmpDir, 'test.env.vault');
    const entries = await readChangelog(vaultPath);
    expect(entries).toEqual([]);
  });

  it('writeChangelog and readChangelog round-trip', async () => {
    const vaultPath = path.join(tmpDir, 'test.env.vault');
    const entries = [
      { timestamp: '2024-01-01T00:00:00.000Z', message: 'Initial commit', author: 'Alice' },
    ];
    await writeChangelog(vaultPath, entries);
    const result = await readChangelog(vaultPath);
    expect(result).toEqual(entries);
  });

  it('appendChangelogEntry adds a new entry', async () => {
    const vaultPath = path.join(tmpDir, 'test.env.vault');
    const entry = await appendChangelogEntry(vaultPath, 'Added DB_URL', 'secret');
    expect(entry.message).toBe('Added DB_URL');
    expect(entry.timestamp).toBeDefined();
    const entries = await readChangelog(vaultPath);
    expect(entries).toHaveLength(1);
    expect(entries[0].message).toBe('Added DB_URL');
  });

  it('appendChangelogEntry accumulates multiple entries', async () => {
    const vaultPath = path.join(tmpDir, 'test.env.vault');
    await appendChangelogEntry(vaultPath, 'First change', 'pass');
    await appendChangelogEntry(vaultPath, 'Second change', 'pass');
    const entries = await readChangelog(vaultPath);
    expect(entries).toHaveLength(2);
    expect(entries[1].message).toBe('Second change');
  });

  it('formatChangelogResult formats entries as readable string', () => {
    const entries = [
      { timestamp: '2024-06-01T12:00:00.000Z', message: 'Rotated keys', author: 'Bob' },
      { timestamp: '2024-06-02T08:30:00.000Z', message: 'Added API_KEY', author: 'Alice' },
    ];
    const output = formatChangelogResult(entries);
    expect(output).toContain('Rotated keys');
    expect(output).toContain('Added API_KEY');
    expect(output).toContain('Bob');
    expect(output).toContain('Alice');
  });

  it('formatChangelogResult returns message for empty changelog', () => {
    const output = formatChangelogResult([]);
    expect(output).toContain('No changelog entries');
  });
});