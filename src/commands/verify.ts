import * as fs from 'fs';
import * as path from 'path';
import { decryptVaultFile, getVaultPath, isVaultFile } from '../crypto/vault';
import { getRepoRoot } from '../git/secrets';

export interface VerifyResult {
  vaultPath: string;
  valid: boolean;
  keyCount?: number;
  error?: string;
}

export function formatVerifyResult(result: VerifyResult): string {
  if (result.valid) {
    return `✔ Vault "${result.vaultPath}" is valid (${result.keyCount} key${result.keyCount === 1 ? '' : 's'} found).`;
  }
  return `✘ Vault "${result.vaultPath}" is invalid: ${result.error}`;
}

export async function runVerify(
  envName: string,
  password: string,
  cwd: string = process.cwd()
): Promise<VerifyResult> {
  const repoRoot = getRepoRoot(cwd);
  const vaultPath = getVaultPath(repoRoot, envName);

  if (!fs.existsSync(vaultPath)) {
    return {
      vaultPath,
      valid: false,
      error: `Vault file not found at ${vaultPath}`,
    };
  }

  if (!isVaultFile(vaultPath)) {
    return {
      vaultPath,
      valid: false,
      error: 'File does not appear to be a valid vault (.vault extension expected)',
    };
  }

  try {
    const entries = await decryptVaultFile(vaultPath, password);
    return {
      vaultPath,
      valid: true,
      keyCount: Object.keys(entries).length,
    };
  } catch (err: any) {
    return {
      vaultPath,
      valid: false,
      error: err.message ?? 'Decryption failed (wrong password or corrupted vault)',
    };
  }
}
