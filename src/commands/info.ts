import * as fs from 'fs';
import * as path from 'path';
import { getRepoRoot, listTrackedVaults } from '../git/secrets';
import { getVaultPath, isVaultFile } from '../crypto/vault';

export interface VaultInfo {
  envFile: string;
  vaultFile: string;
  envExists: boolean;
  vaultExists: boolean;
  vaultTracked: boolean;
  lastModified: Date | null;
}

export function getVaultInfo(envFilePath: string, repoRoot: string): VaultInfo {
  const absEnvPath = path.resolve(envFilePath);
  const vaultFile = getVaultPath(absEnvPath);
  const trackedVaults = listTrackedVaults(repoRoot);

  const envExists = fs.existsSync(absEnvPath);
  const vaultExists = fs.existsSync(vaultFile);
  const vaultTracked = trackedVaults.some((v) => path.resolve(v) === path.resolve(vaultFile));

  let lastModified: Date | null = null;
  if (vaultExists) {
    const stat = fs.statSync(vaultFile);
    lastModified = stat.mtime;
  }

  return {
    envFile: absEnvPath,
    vaultFile,
    envExists,
    vaultExists,
    vaultTracked,
    lastModified,
  };
}

export function formatInfo(info: VaultInfo): string {
  const lines: string[] = [];
  lines.push(`Env file  : ${info.envFile}`);
  lines.push(`Vault file: ${info.vaultFile}`);
  lines.push(`Env exists   : ${info.envExists ? '✔' : '✘'}`);
  lines.push(`Vault exists : ${info.vaultExists ? '✔' : '✘'}`);
  lines.push(`Git tracked  : ${info.vaultTracked ? '✔' : '✘'}`);
  if (info.lastModified) {
    lines.push(`Last modified: ${info.lastModified.toISOString()}`);
  }
  return lines.join('\n');
}

export function runInfo(envFilePath: string): void {
  const repoRoot = getRepoRoot(process.cwd());
  if (!repoRoot) {
    console.error('Not inside a git repository.');
    process.exit(1);
  }

  if (!isVaultFile(envFilePath) && !envFilePath.endsWith('.env')) {
    console.warn('Warning: file does not appear to be a .env file.');
  }

  const info = getVaultInfo(envFilePath, repoRoot);
  console.log(formatInfo(info));
}
