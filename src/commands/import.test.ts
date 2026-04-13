import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { runImport, formatImportResult } from './import';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-import-test-'));
}

describe('runImport', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('imports a valid .env file into a vault', async () => {
    const envContent = 'API_KEY=abc123\nDB_URL=postgres://localhost/db\n';
    const envPath = path.join(tmpDir, '.env');
    fs.writeFileSync(envPath, envContent);

    const result = await runImport('.env', 'production', 'secret', tmpDir);

    expect(result.success).toBe(true);
    expect(result.keyCount).toBe(2);
    expect(result.vaultPath).toContain('production');

    const vaultFullPath = path.join(tmpDir, result.vaultPath);
    expect(fs.existsSync(vaultFullPath)).toBe(true);
  });

  it('returns error if env file does not exist', async () => {
    const result = await runImport('nonexistent.env', 'dev', 'secret', tmpDir);

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/File not found/);
  });

  it('handles empty env file', async () => {
    const envPath = path.join(tmpDir, '.env.empty');
    fs.writeFileSync(envPath, '# just a comment\n');

    const result = await runImport('.env.empty', 'empty', 'secret', tmpDir);

    expect(result.success).toBe(true);
    expect(result.keyCount).toBe(0);
  });
});

describe('formatImportResult', () => {
  it('formats a successful import', () => {
    const output = formatImportResult({
      success: true,
      vaultPath: '.envault/production.vault',
      keyCount: 3,
    });
    expect(output).toContain('✓');
    expect(output).toContain('3 key(s)');
    expect(output).toContain('production.vault');
  });

  it('formats a failed import', () => {
    const output = formatImportResult({
      success: false,
      vaultPath: '',
      keyCount: 0,
      error: 'File not found',
    });
    expect(output).toContain('✗');
    expect(output).toContain('File not found');
  });
});
