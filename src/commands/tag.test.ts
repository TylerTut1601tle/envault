import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  addTags,
  removeTags,
  readTags,
  listByTag,
  writeTags,
  getTagFilePath,
  formatTagResult,
} from './tag';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-tag-test-'));
}

describe('tag module', () => {
  let dir: string;

  beforeEach(() => { dir = makeTempDir(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('reads empty tags when file does not exist', () => {
    expect(readTags(dir)).toEqual({});
  });

  it('writes and reads tags', () => {
    writeTags(dir, { 'dev.env': ['dev', 'local'] });
    expect(readTags(dir)).toEqual({ 'dev.env': ['dev', 'local'] });
  });

  it('addTags adds new tags to a vault', () => {
    const result = addTags(dir, 'dev.env', ['dev', 'local']);
    expect(result.added).toEqual(['dev', 'local']);
    expect(result.tags).toContain('dev');
    expect(result.tags).toContain('local');
  });

  it('addTags does not duplicate existing tags', () => {
    addTags(dir, 'dev.env', ['dev']);
    const result = addTags(dir, 'dev.env', ['dev', 'staging']);
    expect(result.added).toEqual(['staging']);
    expect(result.tags.filter(t => t === 'dev').length).toBe(1);
  });

  it('removeTags removes specified tags', () => {
    addTags(dir, 'dev.env', ['dev', 'local', 'staging']);
    const result = removeTags(dir, 'dev.env', ['local']);
    expect(result.removed).toEqual(['local']);
    expect(result.tags).not.toContain('local');
    expect(result.tags).toContain('dev');
  });

  it('removeTags cleans up vault entry when all tags removed', () => {
    addTags(dir, 'dev.env', ['dev']);
    removeTags(dir, 'dev.env', ['dev']);
    const all = readTags(dir);
    expect(all['dev.env']).toBeUndefined();
  });

  it('listByTag returns vaults with a given tag', () => {
    addTags(dir, 'dev.env', ['dev', 'local']);
    addTags(dir, 'prod.env', ['prod']);
    addTags(dir, 'staging.env', ['dev', 'staging']);
    const devVaults = listByTag(dir, 'dev');
    expect(devVaults).toContain('dev.env');
    expect(devVaults).toContain('staging.env');
    expect(devVaults).not.toContain('prod.env');
  });

  it('formatTagResult includes vault name and tags', () => {
    const result = addTags(dir, 'dev.env', ['dev', 'local']);
    const output = formatTagResult(result);
    expect(output).toContain('dev.env');
    expect(output).toContain('dev');
    expect(output).toContain('local');
  });

  it('getTagFilePath returns correct path', () => {
    expect(getTagFilePath('/some/dir')).toBe('/some/dir/.envault-tags.json');
  });
});
