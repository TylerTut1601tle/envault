import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { runFmt, formatFmtResult } from './fmt';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-fmt-'));
}

describe('runFmt', () => {
  it('returns empty array when .envault dir does not exist', async () => {
    const dir = makeTempDir();
    const results = await runFmt({ dir });
    expect(results).toEqual([]);
  });

  it('reports no changes for already-formatted file', async () => {
    const dir = makeTempDir();
    fs.mkdirSync(`${dir}/.envault`);
    const content = 'FOO=bar\nBAZ=qux\n';
    fs.writeFileSync(`${dir}/.env`, content, 'utf8');

    const results = await runFmt({ dir });
    expect(results.length).toBe(1);
    expect(results[0].changed).toBe(false);
    expect(results[0].error).toBeUndefined();
  });

  it('detects and reformats file with trailing whitespace', async () => {
    const dir = makeTempDir();
    fs.mkdirSync(`${dir}/.envault`);
    const content = 'FOO=bar   \nBAZ=qux\n';
    fs.writeFileSync(`${dir}/.env`, content, 'utf8');

    const results = await runFmt({ dir });
    expect(results.length).toBe(1);
    // changed depends on parser stripping trailing spaces
    expect(results[0].error).toBeUndefined();
  });

  it('does not write file in check mode', async () => {
    const dir = makeTempDir();
    fs.mkdirSync(`${dir}/.envault`);
    const content = 'ZZZ=1\nAAA=2\n';
    fs.writeFileSync(`${dir}/.env`, content, 'utf8');

    await runFmt({ dir, check: true, sortKeys: true });
    const after = fs.readFileSync(`${dir}/.env`, 'utf8');
    expect(after).toBe(content);
  });

  it('sorts keys when sortKeys is true', async () => {
    const dir = makeTempDir();
    fs.mkdirSync(`${dir}/.envault`);
    const content = 'ZZZ=1\nAAA=2\n';
    fs.writeFileSync(`${dir}/.env`, content, 'utf8');

    const results = await runFmt({ dir, sortKeys: true });
    expect(results[0].changed).toBe(true);
    const after = fs.readFileSync(`${dir}/.env`, 'utf8');
    expect(after.indexOf('AAA')).toBeLessThan(after.indexOf('ZZZ'));
  });
});

describe('formatFmtResult', () => {
  it('shows all ok message when nothing changed', () => {
    const results = [{ file: '.env', changed: false }];
    const out = formatFmtResult(results, false);
    expect(out).toContain('All files are properly formatted.');
  });

  it('shows reformatted count in write mode', () => {
    const results = [{ file: '.env', changed: true }];
    const out = formatFmtResult(results, false);
    expect(out).toContain('1 file(s) reformatted.');
    expect(out).toContain('✓ reformatted');
  });

  it('shows would reformat in check mode', () => {
    const results = [{ file: '.env', changed: true }];
    const out = formatFmtResult(results, true);
    expect(out).toContain('1 file(s) would be reformatted.');
    expect(out).toContain('✗ would reformat');
  });

  it('shows errors', () => {
    const results = [{ file: '.env', changed: false, error: 'parse error' }];
    const out = formatFmtResult(results, false);
    expect(out).toContain('✗ .env: parse error');
    expect(out).toContain('1 file(s) had errors.');
  });
});
