import * as path from 'path';
import * as fs from 'fs';
import { initEnvault, ensureGitignoreEntry } from '../git/init';
import { isGitRepo, getRepoRoot } from '../git/secrets';

export interface InitResult {
  success: boolean;
  repoRoot: string;
  vaultDirCreated: boolean;
  gitignoreUpdated: boolean;
  alreadyInitialized: boolean;
  message: string;
}

export async function runInit(cwd: string = process.cwd()): Promise<InitResult> {
  if (!isGitRepo(cwd)) {
    return {
      success: false,
      repoRoot: cwd,
      vaultDirCreated: false,
      gitignoreUpdated: false,
      alreadyInitialized: false,
      message: 'Not a git repository. Please run `git init` first.',
    };
  }

  const repoRoot = getRepoRoot(cwd);
  const vaultDir = path.join(repoRoot, '.envault');
  const alreadyInitialized = fs.existsSync(vaultDir);

  const { vaultDirCreated, gitignoreUpdated } = initEnvault(repoRoot);

  const configPath = path.join(vaultDir, 'config.json');
  if (!fs.existsSync(configPath)) {
    const config = {
      version: 1,
      createdAt: new Date().toISOString(),
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  }

  ensureGitignoreEntry(repoRoot, '.env');
  ensureGitignoreEntry(repoRoot, '.env.local');
  ensureGitignoreEntry(repoRoot, '.env.*.local');

  const message = alreadyInitialized
    ? 'envault already initialized in this repository.'
    : 'envault initialized successfully.';

  return {
    success: true,
    repoRoot,
    vaultDirCreated,
    gitignoreUpdated,
    alreadyInitialized,
    message,
  };
}

export function formatInitResult(result: InitResult): string {
  const lines: string[] = [];
  if (!result.success) {
    lines.push(`✗ ${result.message}`);
    return lines.join('\n');
  }
  lines.push(`✓ ${result.message}`);
  if (result.vaultDirCreated) {
    lines.push(`  Created .envault/ directory`);
  }
  if (result.gitignoreUpdated) {
    lines.push(`  Updated .gitignore with .env patterns`);
  }
  lines.push(`  Repo: ${result.repoRoot}`);
  return lines.join('\n');
}
