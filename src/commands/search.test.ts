import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encryptVaultFile, getVaultPath } from '../crypto/vault';
import { serializeEnvFile } from '../env/parser';
import { formatSearchResult, runSearch } from './search';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-search-'));
}

const PASSWORD = 'test-password';

async function createVault(repoRoot: string, name: string, entries: Record<string, string>) {
  const vaultDir = path.join(repoRoot, '.envault');
  fs.mkdirSync(vaultDir, { recursive: true });
  const content = serializeEnvFile(entries);
  const vaultPath = getVaultPath(repoRoot, name);
  await encryptVaultFile(content, vaultPath, PASSWORD);
  const trackFile = path.join(vaultDir, 'vaults');
  const existing = fs.existsSync(trackFile) ? fs.readFileSync(trackFile, 'utf8').split('\n').filter(Boolean) : [];
  if (!existing.includes(name)) {
    fs.writeFileSync(trackFile, [...existing, name].join('\n') + '\n');
  }
}

describe('runSearch', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTempDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it('returns error when no vaults exist', async () => {
    fs.mkdirSync(path.join(tmpDir, '.envault'), { recursive: true });
    const result = await runSearch(tmpDir, 'API', PASSWORD, false);
    expect(result.error).toBeTruthy();
  });

  it('finds matching keys across vaults', async () => {
    await createVault(tmpDir, 'production', { API_KEY: 'secret', DB_HOST: 'localhost' });
    await createVault(tmpDir, 'staging', { API_KEY: 'staging-secret', PORT: '3000' });
    const result = await runSearch(tmpDir, 'API_KEY', PASSWORD, false);
    expect(result.matches).toHaveLength(2);
    expect(result.vaultsSearched).toBe(2);
    expect(result.matches.map(m => m.vault).sort()).toEqual(['production', 'staging']);
  });

  it('returns no matches for unknown key', async () => {
    await createVault(tmpDir, 'production', { API_KEY: 'secret' });
    const result = await runSearch(tmpDir, 'NONEXISTENT', PASSWORD, false);
    expect(result.matches).toHaveLength(0);
  });

  it('includes values when showValues is true', async () => {
    await createVault(tmpDir, 'production', { API_KEY: 'mysecret' });
    const result = await runSearch(tmpDir, 'API_KEY', PASSWORD, true);
    expect(result.matches[0].value).toBe('mysecret');
  });

  it('does not include values when showValues is false', async () => {
    await createVault(tmpDir, 'production', { API_KEY: 'mysecret' });
    const result = await runSearch(tmpDir, 'API_KEY', PASSWORD, false);
    expect(result.matches[0].value).toBeUndefined();
  });
});

describe('formatSearchResult', () => {
  it('formats error result', () => {
    const out = formatSearchResult({ matches: [], vaultsSearched: 0, error: 'No vaults' }, false);
    expect(out).toContain('Error: No vaults');
  });

  it('formats no matches', () => {
    const out = formatSearchResult({ matches: [], vaultsSearched: 2 }, false);
    expect(out).toContain('No matches found');
    expect(out).toContain('2 vault');
  });

  it('formats matches without values', () => {
    const out = formatSearchResult({ matches: [{ vault: 'prod', key: 'API_KEY' }], vaultsSearched: 1 }, false);
    expect(out).toContain('[prod] API_KEY');
    expect(out).not.toContain('=');
  });

  it('formats matches with values', () => {
    const out = formatSearchResult({ matches: [{ vault: 'prod', key: 'API_KEY', value: 'abc' }], vaultsSearched: 1 }, true);
    expect(out).toContain('[prod] API_KEY=abc');
  });
});
