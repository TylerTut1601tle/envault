import * as fs from 'fs';
import * as path from 'path';
import { getRepoRoot, listTrackedVaults, ensureVaultDirTracked } from '../git/secrets';
import { getVaultPath, isVaultFile } from '../crypto/vault';

export interface PushResult {
  success: boolean;
  vaultPath?: string;
  envFile?: string;
  alreadyTracked?: boolean;
  error?: string;
}

export function formatPushResult(result: PushResult): string {
  if (!result.success) {
    return `✗ Push failed: ${result.error}`;
  }
  if (result.alreadyTracked) {
    return `✓ Vault already tracked: ${result.vaultPath}`;
  }
  return `✓ Vault registered for tracking: ${result.vaultPath}\n  Source: ${result.envFile}\n  Commit the vault file to share with your team.`;
}

export async function pushCommand(
  envFile: string,
  options: { cwd?: string } = {}
): Promise<PushResult> {
  const cwd = options.cwd ?? process.cwd();

  try {
    const repoRoot = await getRepoRoot(cwd);
    if (!repoRoot) {
      return { success: false, error: 'Not inside a Git repository.' };
    }

    const absEnvFile = path.resolve(cwd, envFile);
    if (!fs.existsSync(absEnvFile)) {
      return { success: false, error: `Env file not found: ${envFile}` };
    }

    const vaultPath = getVaultPath(absEnvFile);
    if (!fs.existsSync(vaultPath)) {
      return {
        success: false,
        error: `No vault found for ${envFile}. Run 'envault lock ${envFile}' first.`,
      };
    }

    const tracked = await listTrackedVaults(repoRoot);
    const relVaultPath = path.relative(repoRoot, vaultPath);

    if (tracked.includes(relVaultPath)) {
      return { success: true, vaultPath: relVaultPath, envFile, alreadyTracked: true };
    }

    await ensureVaultDirTracked(repoRoot, vaultPath);

    return { success: true, vaultPath: relVaultPath, envFile };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
