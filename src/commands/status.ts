import * as fs from 'fs';
import * as path from 'path';
import { getRepoRoot, listTrackedVaults, isGitRepo } from '../git/secrets';
import { getVaultPath, isVaultFile } from '../crypto/vault';

export interface EnvStatus {
  envFile: string;
  vaultFile: string;
  envExists: boolean;
  vaultExists: boolean;
  isTracked: boolean;
  inSync: boolean | null;
}

export async function getStatus(envFilePath: string): Promise<EnvStatus> {
  const absEnvPath = path.resolve(envFilePath);
  const vaultPath = getVaultPath(absEnvPath);

  const envExists = fs.existsSync(absEnvPath);
  const vaultExists = fs.existsSync(vaultPath);

  let isTracked = false;
  let inSync: boolean | null = null;

  if (await isGitRepo(path.dirname(absEnvPath))) {
    const repoRoot = await getRepoRoot(path.dirname(absEnvPath));
    const trackedVaults = await listTrackedVaults(repoRoot);
    const relVaultPath = path.relative(repoRoot, vaultPath);
    isTracked = trackedVaults.includes(relVaultPath);
  }

  if (envExists && vaultExists) {
    const envStat = fs.statSync(absEnvPath);
    const vaultStat = fs.statSync(vaultPath);
    inSync = vaultStat.mtimeMs >= envStat.mtimeMs;
  }

  return {
    envFile: absEnvPath,
    vaultFile: vaultPath,
    envExists,
    vaultExists,
    isTracked,
    inSync,
  };
}

export function formatStatus(status: EnvStatus): string {
  const lines: string[] = [];
  lines.push(`Env file:    ${status.envFile}`);
  lines.push(`Vault file:  ${status.vaultFile}`);
  lines.push(`Env exists:  ${status.envExists ? '✔' : '✘'}`);
  lines.push(`Vault exists:${status.vaultExists ? '✔' : '✘'}`);
  lines.push(`Git tracked: ${status.isTracked ? '✔' : '✘'}`);

  if (status.inSync === null) {
    lines.push(`In sync:     N/A (one or both files missing)`);
  } else {
    lines.push(`In sync:     ${status.inSync ? '✔' : '⚠ vault may be outdated'}`);
  }

  return lines.join('\n');
}
