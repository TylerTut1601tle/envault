import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { lockEnvFile } from './lock';
import { unlockVaultFile } from './unlock';

const PASSPHRASE = 'test-passphrase-456';
const ENV_CONTENT = 'API_KEY=supersecret\nDB_URL=postgres://localhost/db\n';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-unlock-test-'));
}

describe('unlockVaultFile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  async function createVault(name = '.env'): Promise<{ envPath: string; vaultPath: string }> {
    const envPath = path.join(tmpDir, name);
    fs.writeFileSync(envPath, ENV_CONTENT);
    const result = await lockEnvFile({ envFile: envPath, passphrase: PASSPHRASE, removeOriginal: true });
    return { envPath, vaultPath: result.vaultPath };
  }

  it('decrypts vault back to original content', async () => {
    const { vaultPath, envPath } = await createVault();
    const result = await unlockVaultFile({ vaultFile: vaultPath, passphrase: PASSPHRASE });

    expect(fs.existsSync(result.outputPath)).toBe(true);
    expect(fs.readFileSync(result.outputPath, 'utf-8')).toBe(ENV_CONTENT);
  });

  it('writes to custom output file', async () => {
    const { vaultPath } = await createVault();
    const customOutput = path.join(tmpDir, '.env.custom');
    const result = await unlockVaultFile({
      vaultFile: vaultPath,
      passphrase: PASSPHRASE,
      outputFile: customOutput,
    });

    expect(result.outputPath).toBe(customOutput);
    expect(fs.readFileSync(customOutput, 'utf-8')).toBe(ENV_CONTENT);
  });

  it('throws if vault file does not exist', async () => {
    await expect(
      unlockVaultFile({ vaultFile: path.join(tmpDir, 'missing.vault'), passphrase: PASSPHRASE })
    ).rejects.toThrow('Vault file not found');
  });

  it('throws on wrong passphrase', async () => {
    const { vaultPath } = await createVault();
    await expect(
      unlockVaultFile({ vaultFile: vaultPath, passphrase: 'wrong-passphrase' })
    ).rejects.toThrow();
  });

  it('throws if output already exists without overwrite', async () => {
    const { vaultPath, envPath } = await createVault();
    fs.writeFileSync(envPath, 'existing content');
    await expect(
      unlockVaultFile({ vaultFile: vaultPath, passphrase: PASSPHRASE })
    ).rejects.toThrow('Output file already exists');
  });
});
