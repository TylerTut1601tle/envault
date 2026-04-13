import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import { runInit, formatInitResult } from './init';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-init-test-'));
}

describe('runInit', () => {
  it('returns failure when not a git repo', async () => {
    const dir = makeTempDir();
    try {
      const result = await runInit(dir);
      expect(result.success).toBe(false);
      expect(result.message).toMatch(/not a git repository/i);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('initializes successfully in a git repo', async () => {
    const dir = makeTempDir();
    try {
      execSync('git init', { cwd: dir, stdio: 'ignore' });
      const result = await runInit(dir);
      expect(result.success).toBe(true);
      expect(result.alreadyInitialized).toBe(false);
      expect(fs.existsSync(path.join(dir, '.envault'))).toBe(true);
      expect(fs.existsSync(path.join(dir, '.envault', 'config.json'))).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('detects already initialized repo', async () => {
    const dir = makeTempDir();
    try {
      execSync('git init', { cwd: dir, stdio: 'ignore' });
      await runInit(dir);
      const result = await runInit(dir);
      expect(result.success).toBe(true);
      expect(result.alreadyInitialized).toBe(true);
      expect(result.message).toMatch(/already initialized/i);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('writes valid config.json', async () => {
    const dir = makeTempDir();
    try {
      execSync('git init', { cwd: dir, stdio: 'ignore' });
      await runInit(dir);
      const config = JSON.parse(
        fs.readFileSync(path.join(dir, '.envault', 'config.json'), 'utf8')
      );
      expect(config.version).toBe(1);
      expect(typeof config.createdAt).toBe('string');
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('formatInitResult', () => {
  it('formats failure result', () => {
    const result = {
      success: false,
      repoRoot: '/tmp/test',
      vaultDirCreated: false,
      gitignoreUpdated: false,
      alreadyInitialized: false,
      message: 'Not a git repository.',
    };
    const output = formatInitResult(result);
    expect(output).toContain('✗');
    expect(output).toContain('Not a git repository.');
  });

  it('formats success result', () => {
    const result = {
      success: true,
      repoRoot: '/tmp/test',
      vaultDirCreated: true,
      gitignoreUpdated: true,
      alreadyInitialized: false,
      message: 'envault initialized successfully.',
    };
    const output = formatInitResult(result);
    expect(output).toContain('✓');
    expect(output).toContain('Created .envault/');
    expect(output).toContain('Updated .gitignore');
  });
});
