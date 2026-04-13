import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getChangelogPath,
  readChangelog,
  writeChangelog,
  appendChangelogEntry,
  formatChangelogResult,
} from './changelog';

function makeTempDir(): string {
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

  it('returns empty array when no changelog file exists', () => {
    const entries = readChangelog(tmpDir);
    expect(entries).toEqual([]);
  });

  it('writes and reads changelog entries', () => {
    const entries = [
      { timestamp: '2024-01-01T00:00:00.000Z', action: 'lock', vault: '.env', user: 'alice' },
    ];
    writeChangelog(tmpDir, entries);
    const read = readChangelog(tmpDir);
    expect(read).toHaveLength(1);
    expect(read[0].action).toBe('lock');
    expect(read[0].vault).toBe('.env');
  });

  it('appends entries with a timestamp', () => {
    appendChangelogEntry(tmpDir, { action: 'unlock', vault: '.env.staging' });
    appendChangelogEntry(tmpDir, { action: 'rotate', vault: '.env.staging', user: 'bob' });
    const entries = readChangelog(tmpDir);
    expect(entries).toHaveLength(2);
    expect(entries[0].action).toBe('unlock');
    expect(entries[1].action).toBe('rotate');
    expect(entries[1].user).toBe('bob');
    expect(typeof entries[0].timestamp).toBe('string');
  });

  it('formats changelog entries as readable strings', () => {
    const entries = [
      { timestamp: '2024-01-01T00:00:00.000Z', action: 'lock', vault: '.env', user: 'alice', details: 'AES-256' },
      { timestamp: '2024-01-02T00:00:00.000Z', action: 'rotate', vault: '.env' },
    ];
    const output = formatChangelogResult(entries);
    expect(output).toContain('lock');
    expect(output).toContain('rotate');
    expect(output).toContain('alice');
    expect(output).toContain('AES-256');
  });

  it('filters changelog by vault name', () => {
    const entries = [
      { timestamp: '2024-01-01T00:00:00.000Z', action: 'lock', vault: '.env' },
      { timestamp: '2024-01-02T00:00:00.000Z', action: 'lock', vault: '.env.staging' },
    ];
    const output = formatChangelogResult(entries, '.env');
    expect(output).toContain('.env');
    expect(output).not.toContain('.env.staging');
  });

  it('returns a message when no entries match', () => {
    const output = formatChangelogResult([], '.env');
    expect(output).toMatch(/no changelog/i);
  });

  it('getChangelogPath returns correct path', () => {
    const p = getChangelogPath(tmpDir);
    expect(p).toBe(path.join(tmpDir, '.envault', 'changelog.json'));
  });
});
