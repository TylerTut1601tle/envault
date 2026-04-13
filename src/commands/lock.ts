import * as fs from 'fs';
import * as path from 'path';
import { encryptEnvFile, getVaultPath, isVaultFile } from '../crypto/vault';
import { ensureVaultDirTracked } from '../git/secrets';

export interface LockOptions {
  envFile: string;
  passphrase: string;
  removeOriginal?: boolean;
}

export interface LockResult {
  vaultPath: string;
  envFile: string;
  removedOriginal: boolean;
}

export async function lockEnvFile(options: LockOptions): Promise<LockResult> {
  const { envFile, passphrase, removeOriginal = false } = options;

  const absoluteEnvPath = path.resolve(envFile);

  if (!fs.existsSync(absoluteEnvPath)) {
    throw new Error(`Env file not found: ${absoluteEnvPath}`);
  }

  if (isVaultFile(absoluteEnvPath)) {
    throw new Error(`File is already a vault file: ${absoluteEnvPath}`);
  }

  const vaultPath = getVaultPath(absoluteEnvPath);

  if (fs.existsSync(vaultPath)) {
    throw new Error(`Vault file already exists: ${vaultPath}. Use --force to overwrite.`);
  }

  const envContent = fs.readFileSync(absoluteEnvPath, 'utf-8');
  await encryptEnvFile(envContent, passphrase, vaultPath);

  try {
    await ensureVaultDirTracked(path.dirname(vaultPath));
  } catch {
    // non-fatal: may not be in a git repo
  }

  if (removeOriginal) {
    fs.unlinkSync(absoluteEnvPath);
  }

  return {
    vaultPath,
    envFile: absoluteEnvPath,
    removedOriginal: removeOriginal,
  };
}
