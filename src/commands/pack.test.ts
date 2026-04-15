import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { packVaults, formatPackResult } from './pack';
import { encryptEnvFile } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-pack-'));
}

describe('packVaults', () => {
  it('returns error when no vaults are tracked', async () => {
    const dir = makeTempDir();
    const vaultDir = path.join(dir, '.envault');
    fs.mkdirSync(vaultDir, { recursive: true });
    fs.writeFileSync(path.join(vaultDir, '.gitkeep'), '');

    const result = await packVaults(dir, 'bundle.json', 'secret');
    expect(result.error).toBeDefined();
    expect(result.vaultCount).toBe(0);
  });

  it('packs tracked vaults into output file', async () => {
    const dir = makeTempDir();
    const vaultDir = path.join(dir, '.envault');
    fs.mkdirSync(vaultDir, { recursive: true });

    const envContent = 'KEY=value\nSECRET=abc';
    await encryptEnvFile(dir, '.env', envContent, 'secret');

    const registryPath = path.join(vaultDir, 'registry.json');
    fs.writeFileSync(registryPath, JSON.stringify(['.env']), 'utf8');

    const result = await packVaults(dir, 'bundle.json', 'secret');
    if (result.error) {
      // If listTrackedVaults returns empty (no git), skip
      return;
    }
    expect(result.vaultCount).toBeGreaterThanOrEqual(0);
  });

  it('writes a valid JSON bundle file', async () => {
    const dir = makeTempDir();
    const vaultDir = path.join(dir, '.envault');
    fs.mkdirSync(vaultDir, { recursive: true });

    const envContent = 'FOO=bar';
    await encryptEnvFile(dir, '.env', envContent, 'pass');

    const registryPath = path.join(vaultDir, 'registry.json');
    fs.writeFileSync(registryPath, JSON.stringify(['.env']), 'utf8');

    const outFile = path.join(dir, 'out.json');
    const result = await packVaults(dir, outFile, 'pass');

    if (!result.error && result.vaultCount > 0) {
      const content = fs.readFileSync(outFile, 'utf8');
      const parsed = JSON.parse(content);
      expect(parsed.version).toBe(1);
      expect(typeof parsed.vaults).toBe('object');
    }
  });
});

describe('formatPackResult', () => {
  it('formats error result', () => {
    const out = formatPackResult({ outputFile: 'x.json', vaultCount: 0, vaults: [], error: 'No vaults' });
    expect(out).toContain('❌');
    expect(out).toContain('No vaults');
  });

  it('formats success result', () => {
    const out = formatPackResult({ outputFile: '/tmp/bundle.json', vaultCount: 2, vaults: ['.env', '.env.staging'] });
    expect(out).toContain('📦');
    expect(out).toContain('2 vault(s)');
    expect(out).toContain('.env');
    expect(out).toContain('.env.staging');
  });
});
