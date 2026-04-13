import * as fs from 'fs';
import * as path from 'path';
import { decryptVaultFile, encryptEnvFile, getVaultPath, isVaultFile } from '../crypto/vault';
import { getRepoRoot } from '../git/secrets';

export interface CloneResult {
  source: string;
  destination: string;
  success: boolean;
  error?: string;
}

export async function runClone(
  sourceEnv: string,
  destEnv: string,
  password: string,
  cwd: string = process.cwd()
): Promise<CloneResult> {
  const repoRoot = getRepoRoot(cwd);
  const baseDir = repoRoot ?? cwd;

  const sourceVault = getVaultPath(sourceEnv, baseDir);
  const destVault = getVaultPath(destEnv, baseDir);

  if (!fs.existsSync(sourceVault)) {
    return { source: sourceEnv, destination: destEnv, success: false, error: `Source vault not found: ${sourceVault}` };
  }

  if (fs.existsSync(destVault)) {
    return { source: sourceEnv, destination: destEnv, success: false, error: `Destination vault already exists: ${destVault}` };
  }

  try {
    const entries = await decryptVaultFile(sourceVault, password);
    await encryptEnvFile(entries, destVault, password);
    return { source: sourceEnv, destination: destEnv, success: true };
  } catch (err: any) {
    return { source: sourceEnv, destination: destEnv, success: false, error: err.message };
  }
}

export function formatCloneResult(result: CloneResult): string {
  if (!result.success) {
    return `✗ Clone failed: ${result.error}`;
  }
  return `✓ Cloned "${result.source}" → "${result.destination}" successfully.`;
}
