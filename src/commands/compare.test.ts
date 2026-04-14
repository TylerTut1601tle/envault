import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { compareEnvMaps, formatCompareResult, runCompare } from './compare';
import { encryptEnvFile } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-compare-'));
}

describe('compareEnvMaps', () => {
  it('identifies keys only in A', () => {
    const result = compareEnvMaps({ FOO: '1', BAR: '2' }, { FOO: '1' });
    expect(result.onlyInA).toEqual(['BAR']);
    expect(result.onlyInB).toEqual([]);
  });

  it('identifies keys only in B', () => {
    const result = compareEnvMaps({ FOO: '1' }, { FOO: '1', BAZ: '3' });
    expect(result.onlyInB).toEqual(['BAZ']);
  });

  it('identifies different values', () => {
    const result = compareEnvMaps({ FOO: 'old' }, { FOO: 'new' });
    expect(result.different).toEqual(['FOO']);
    expect(result.same).toEqual([]);
  });

  it('identifies same values', () => {
    const result = compareEnvMaps({ FOO: 'same' }, { FOO: 'same' });
    expect(result.same).toEqual(['FOO']);
    expect(result.different).toEqual([]);
  });

  it('handles empty maps', () => {
    const result = compareEnvMaps({}, {});
    expect(result.onlyInA).toEqual([]);
    expect(result.onlyInB).toEqual([]);
    expect(result.different).toEqual([]);
    expect(result.same).toEqual([]);
  });
});

describe('formatCompareResult', () => {
  it('shows identical message when no differences', () => {
    const result = { onlyInA: [], onlyInB: [], different: [], same: ['FOO'] };
    const output = formatCompareResult(result, 'dev', 'prod');
    expect(output).toContain('✓ Vaults are identical');
  });

  it('shows differences', () => {
    const result = { onlyInA: ['ONLY_A'], onlyInB: ['ONLY_B'], different: ['DIFF'], same: [] };
    const output = formatCompareResult(result, 'dev', 'prod');
    expect(output).toContain('ONLY_A');
    expect(output).toContain('ONLY_B');
    expect(output).toContain('DIFF');
  });
});

describe('runCompare', () => {
  let tmpDir: string;
  const password = 'test-password-123';

  beforeEach(() => { tmpDir = makeTempDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true }); });

  it('compares two vault files', async () => {
    const vaultsDir = path.join(tmpDir, '.envault');
    fs.mkdirSync(vaultsDir, { recursive: true });
    await encryptEnvFile('FOO=hello\nBAR=world\n', path.join(vaultsDir, 'dev.vault'), password);
    await encryptEnvFile('FOO=hello\nBAZ=extra\n', path.join(vaultsDir, 'prod.vault'), password);

    const result = await runCompare('dev', 'prod', password, tmpDir);
    expect(result.onlyInA).toContain('BAR');
    expect(result.onlyInB).toContain('BAZ');
    expect(result.same).toContain('FOO');
  });

  it('throws if vault does not exist', async () => {
    await expect(runCompare('missing', 'also-missing', password, tmpDir)).rejects.toThrow('Vault not found');
  });
});
