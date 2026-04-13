import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  readRegistry,
  writeRegistry,
  registerVault,
  unregisterVault,
  TrackedEntry,
} from './push-register';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-registry-'));
}

describe('readRegistry', () => {
  it('returns empty array when registry does not exist', () => {
    const dir = makeTempDir();
    expect(readRegistry(dir)).toEqual([]);
  });

  it('returns parsed entries when registry exists', () => {
    const dir = makeTempDir();
    const entries: TrackedEntry[] = [
      { envFile: '.env', vaultPath: '.envault/.env.vault.enc', addedAt: '2024-01-01T00:00:00.000Z' },
    ];
    fs.mkdirSync(path.join(dir, '.envault'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.envault/tracked.json'), JSON.stringify(entries, null, 2));
    expect(readRegistry(dir)).toEqual(entries);
  });

  it('returns empty array on malformed JSON', () => {
    const dir = makeTempDir();
    fs.mkdirSync(path.join(dir, '.envault'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.envault/tracked.json'), 'NOT JSON');
    expect(readRegistry(dir)).toEqual([]);
  });
});

describe('registerVault', () => {
  it('adds a new entry', () => {
    const dir = makeTempDir();
    const result = registerVault(dir, '.env', '.envault/.env.vault.enc');
    expect(result.added).toBe(true);
    const entries = readRegistry(dir);
    expect(entries).toHaveLength(1);
    expect(entries[0].envFile).toBe('.env');
  });

  it('does not duplicate an existing vault path', () => {
    const dir = makeTempDir();
    registerVault(dir, '.env', '.envault/.env.vault.enc');
    const result = registerVault(dir, '.env', '.envault/.env.vault.enc');
    expect(result.added).toBe(false);
    expect(readRegistry(dir)).toHaveLength(1);
  });
});

describe('unregisterVault', () => {
  it('removes an existing entry', () => {
    const dir = makeTempDir();
    registerVault(dir, '.env', '.envault/.env.vault.enc');
    const result = unregisterVault(dir, '.envault/.env.vault.enc');
    expect(result.removed).toBe(true);
    expect(readRegistry(dir)).toHaveLength(0);
  });

  it('returns removed false when entry not found', () => {
    const dir = makeTempDir();
    const result = unregisterVault(dir, '.envault/.env.vault.enc');
    expect(result.removed).toBe(false);
  });
});
