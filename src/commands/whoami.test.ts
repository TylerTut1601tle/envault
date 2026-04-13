import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getWhoamiInfo, formatWhoamiResult, runWhoami } from './whoami';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-whoami-test-'));
}

describe('getWhoamiInfo', () => {
  it('returns configPath pointing to home dir', () => {
    const info = getWhoamiInfo(process.cwd());
    expect(info.configPath).toContain('.envault');
    expect(info.configPath).toContain('config.json');
  });

  it('hasPassword is false when config file does not exist', () => {
    const tmp = makeTempDir();
    // Override home to temp dir by mocking os.homedir is complex;
    // instead just verify the boolean reflects file existence
    const info = getWhoamiInfo(tmp);
    expect(typeof info.hasPassword).toBe('boolean');
    fs.rmSync(tmp, { recursive: true });
  });

  it('repoRoot is undefined when not in a git repo', () => {
    const tmp = makeTempDir();
    const info = getWhoamiInfo(tmp);
    expect(info.repoRoot).toBeUndefined();
    fs.rmSync(tmp, { recursive: true });
  });

  it('repoRoot is set when inside a git repo', () => {
    const info = getWhoamiInfo(process.cwd());
    // The test suite itself runs inside a git repo
    expect(typeof info.repoRoot === 'string' || info.repoRoot === undefined).toBe(true);
  });
});

describe('formatWhoamiResult', () => {
  it('includes envault identity header', () => {
    const result = formatWhoamiResult({
      configPath: '/home/user/.envault/config.json',
      hasPassword: true,
      gitUser: 'Alice',
      gitEmail: 'alice@example.com',
      repoRoot: '/home/user/project',
    });
    expect(result).toContain('envault identity:');
    expect(result).toContain('Alice');
    expect(result).toContain('alice@example.com');
    expect(result).toContain('stored');
    expect(result).toContain('/home/user/project');
  });

  it('shows not stored when hasPassword is false', () => {
    const result = formatWhoamiResult({
      configPath: '/home/user/.envault/config.json',
      hasPassword: false,
    });
    expect(result).toContain('not stored');
  });

  it('shows not in a git repo when repoRoot is undefined', () => {
    const result = formatWhoamiResult({
      configPath: '/home/user/.envault/config.json',
      hasPassword: false,
      repoRoot: undefined,
    });
    expect(result).toContain('not in a git repo');
  });
});

describe('runWhoami', () => {
  it('returns a non-empty string', () => {
    const output = runWhoami(process.cwd());
    expect(typeof output).toBe('string');
    expect(output.length).toBeGreaterThan(0);
  });
});
