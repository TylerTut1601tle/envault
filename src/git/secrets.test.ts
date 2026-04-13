import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import {
  ensureVaultDirTracked,
  getDefaultConfig,
  listTrackedVaults,
} from './secrets';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-git-test-'));
}

describe('getDefaultConfig', () => {
  it('returns correct paths based on repo root', () => {
    const config = getDefaultConfig('/my/repo');
    expect(config.vaultDir).toBe('/my/repo/.envault');
    expect(config.gitAttributesPath).toBe('/my/repo/.gitattributes');
  });
});

describe('ensureVaultDirTracked', () => {
  it('creates vault dir if it does not exist', () => {
    const tmp = makeTempDir();
    const config = getDefaultConfig(tmp);
    ensureVaultDirTracked(config);
    expect(fs.existsSync(config.vaultDir)).toBe(true);
    fs.rmSync(tmp, { recursive: true });
  });

  it('creates .gitattributes with vault entry', () => {
    const tmp = makeTempDir();
    const config = getDefaultConfig(tmp);
    ensureVaultDirTracked(config);
    const content = fs.readFileSync(config.gitAttributesPath, 'utf8');
    expect(content).toContain('.envault/*.vault binary');
    fs.rmSync(tmp, { recursive: true });
  });

  it('does not duplicate entry in .gitattributes', () => {
    const tmp = makeTempDir();
    const config = getDefaultConfig(tmp);
    ensureVaultDirTracked(config);
    ensureVaultDirTracked(config);
    const content = fs.readFileSync(config.gitAttributesPath, 'utf8');
    const count = (content.match(/# envault/g) || []).length;
    expect(count).toBe(1);
    fs.rmSync(tmp, { recursive: true });
  });
});

describe('listTrackedVaults', () => {
  it('returns empty array when vault dir does not exist', () => {
    expect(listTrackedVaults('/nonexistent/path/.envault')).toEqual([]);
  });

  it('returns only .vault files', () => {
    const tmp = makeTempDir();
    fs.writeFileSync(path.join(tmp, 'dev.vault'), '');
    fs.writeFileSync(path.join(tmp, 'prod.vault'), '');
    fs.writeFileSync(path.join(tmp, 'notes.txt'), '');
    const vaults = listTrackedVaults(tmp);
    expect(vaults).toContain('dev.vault');
    expect(vaults).toContain('prod.vault');
    expect(vaults).not.toContain('notes.txt');
    fs.rmSync(tmp, { recursive: true });
  });
});
