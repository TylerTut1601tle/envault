import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { lintEnvContent, runLint, formatLintResult } from './lint';
import { encryptEnvFile, getVaultPath } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-lint-'));
}

describe('lintEnvContent', () => {
  it('returns no issues for valid content', () => {
    const issues = lintEnvContent('FOO=bar\nBAZ=qux\n');
    expect(issues).toHaveLength(0);
  });

  it('detects missing equals sign', () => {
    const issues = lintEnvContent('INVALID_LINE\n');
    expect(issues.some(i => i.message.includes('Missing "="'))).toBe(true);
  });

  it('detects duplicate keys', () => {
    const issues = lintEnvContent('FOO=bar\nFOO=baz\n');
    expect(issues.some(i => i.message.includes('Duplicate key'))).toBe(true);
  });

  it('warns on empty value', () => {
    const issues = lintEnvContent('FOO=\n');
    expect(issues.some(i => i.severity === 'warning' && i.key === 'FOO')).toBe(true);
  });

  it('warns on invalid key characters', () => {
    const issues = lintEnvContent('foo-bar=baz\n');
    expect(issues.some(i => i.message.includes('invalid characters'))).toBe(true);
  });

  it('skips comments and blank lines', () => {
    const issues = lintEnvContent('# comment\n\nFOO=bar\n');
    expect(issues).toHaveLength(0);
  });
});

describe('runLint', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTempDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true }); });

  it('lints a plain .env file', async () => {
    const envPath = path.join(tmpDir, '.env');
    fs.writeFileSync(envPath, 'FOO=bar\nBAZ=qux\n');
    const result = await runLint(envPath, '');
    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('lints an encrypted vault file', async () => {
    const envPath = path.join(tmpDir, '.env');
    fs.writeFileSync(envPath, 'FOO=bar\nFOO=dup\n');
    const vaultPath = getVaultPath(envPath);
    const encrypted = await encryptEnvFile(envPath, 'secret');
    fs.writeFileSync(vaultPath, encrypted);
    const result = await runLint(vaultPath, 'secret');
    expect(result.ok).toBe(false);
    expect(result.issues.some(i => i.message.includes('Duplicate key'))).toBe(true);
  });
});

describe('formatLintResult', () => {
  it('shows success message when no issues', () => {
    const out = formatLintResult({ file: '.env', issues: [], ok: true });
    expect(out).toContain('No issues found');
  });

  it('shows error and warning icons', () => {
    const out = formatLintResult({
      file: '.env',
      issues: [
        { line: 1, key: 'FOO', message: 'Duplicate key', severity: 'error' },
        { line: 2, key: 'BAR', message: 'Empty value', severity: 'warning' },
      ],
      ok: false,
    });
    expect(out).toContain('❌');
    expect(out).toContain('⚠️');
  });
});
