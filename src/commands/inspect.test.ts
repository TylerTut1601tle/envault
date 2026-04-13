import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { runInspect, formatInspectResult } from './inspect';
import { encryptEnvFile } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-inspect-'));
}

describe('runInspect', () => {
  let tmpDir: string;
  const password = 'inspect-secret';

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('decrypts vault and returns key list', async () => {
    const envContent = 'API_KEY=abc123\nDB_URL=postgres://localhost/test\n';
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, envContent);
    await encryptEnvFile(envFile, password);

    const result = await runInspect('.env', password, tmpDir);
    expect(result.keyCount).toBe(2);
    expect(result.keys).toContain('API_KEY');
    expect(result.keys).toContain('DB_URL');
    expect(result.sizeBytes).toBeGreaterThan(0);
  });

  it('throws when vault does not exist', async () => {
    await expect(runInspect('.env.missing', password, tmpDir)).rejects.toThrow(
      "No vault found for '.env.missing'"
    );
  });

  it('formatInspectResult produces readable output', async () => {
    const envContent = 'TOKEN=xyz\n';
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, envContent);
    await encryptEnvFile(envFile, password);

    const result = await runInspect('.env', password, tmpDir);
    const output = formatInspectResult(result);
    expect(output).toContain('Vault:');
    expect(output).toContain('Keys (1):');
    expect(output).toContain('  - TOKEN');
  });
});
