import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { maskValue, runMask, formatMaskResult } from './mask';
import { encryptEnvFile } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-mask-test-'));
}

describe('maskValue', () => {
  it('masks full value by default', () => {
    expect(maskValue('supersecret')).toBe('********');
  });

  it('shows trailing characters when show > 0', () => {
    const result = maskValue('supersecret', 3);
    expect(result.endsWith('ret')).toBe(true);
    expect(result.startsWith('*')).toBe(true);
  });

  it('uses custom masking character', () => {
    const result = maskValue('hello', 0, '#');
    expect(result).toMatch(/^#+$/);
  });

  it('returns empty string for empty value', () => {
    expect(maskValue('')).toBe('');
  });
});

describe('runMask (plain env file)', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('masks all entries in a plain .env file', async () => {
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'FOO=bar\nBAZ=qux\n');
    const result = await runMask(envFile, 'unused');
    expect(result.total).toBe(2);
    expect(result.entries.find(e => e.key === 'FOO')).toBeDefined();
    expect(result.entries.find(e => e.key === 'FOO')?.masked).not.toBe('bar');
  });

  it('filters by keys option', async () => {
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'FOO=bar\nBAZ=qux\n');
    const result = await runMask(envFile, 'unused', { keys: ['FOO'] });
    expect(result.total).toBe(1);
    expect(result.entries[0].key).toBe('FOO');
  });

  it('decrypts vault file and masks values', async () => {
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'SECRET=hunter2\n');
    await encryptEnvFile(envFile, 'testpass');
    fs.unlinkSync(envFile);
    const result = await runMask(envFile, 'testpass');
    expect(result.total).toBe(1);
    expect(result.entries[0].key).toBe('SECRET');
    expect(result.entries[0].masked).not.toBe('hunter2');
  });
});

describe('formatMaskResult', () => {
  it('formats entries as KEY=masked lines', () => {
    const result = { file: '.env', entries: [{ key: 'A', masked: '****' }, { key: 'B', masked: '***' }], total: 2 };
    const output = formatMaskResult(result);
    expect(output).toContain('A=****');
    expect(output).toContain('B=***');
  });

  it('returns no entries message when empty', () => {
    const result = { file: '.env', entries: [], total: 0 };
    expect(formatMaskResult(result)).toContain('No entries found');
  });
});
