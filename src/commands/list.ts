import * as path from 'path';
import * as fs from 'fs';
import { getRepoRoot, listTrackedVaults, isGitRepo } from '../git/secrets';
import { getStatus, EnvStatus } from './status';

export interface ListOptions {
  cwd?: string;
}

export async function listVaults(options: ListOptions = {}): Promise<EnvStatus[]> {
  const cwd = options.cwd ?? process.cwd();

  if (!(await isGitRepo(cwd))) {
    throw new Error('Not inside a Git repository.');
  }

  const repoRoot = await getRepoRoot(cwd);
  const trackedVaults = await listTrackedVaults(repoRoot);

  if (trackedVaults.length === 0) {
    return [];
  }

  const statuses: EnvStatus[] = [];

  for (const relVaultPath of trackedVaults) {
    const absVaultPath = path.join(repoRoot, relVaultPath);
    // Derive the .env path by removing the .vault extension
    const absEnvPath = absVaultPath.replace(/\.vault$/, '');
    const status = await getStatus(absEnvPath);
    statuses.push(status);
  }

  return statuses;
}

export function formatList(statuses: EnvStatus[]): string {
  if (statuses.length === 0) {
    return 'No vaults are currently tracked.';
  }

  const lines: string[] = ['Tracked vaults:', ''];

  for (const s of statuses) {
    const syncLabel = s.inSync === null ? 'N/A' : s.inSync ? 'in sync' : 'outdated';
    const envLabel = s.envExists ? 'env ✔' : 'env ✘';
    lines.push(`  ${s.vaultFile}`);
    lines.push(`    ${envLabel}  vault ✔  sync: ${syncLabel}`);
    lines.push('');
  }

  return lines.join('\n').trimEnd();
}
