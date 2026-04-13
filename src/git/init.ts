import * as path from 'path';
import * as fs from 'fs';
import { getRepoRoot, getDefaultConfig, ensureVaultDirTracked, isGitRepo } from './secrets';

export interface InitResult {
  repoRoot: string;
  vaultDir: string;
  gitignoreUpdated: boolean;
  gitattributesUpdated: boolean;
}

export function initEnvault(cwd: string = process.cwd()): InitResult {
  if (!isGitRepo(cwd)) {
    throw new Error('envault must be initialized inside a Git repository.');
  }

  const repoRoot = getRepoRoot();
  const config = getDefaultConfig(repoRoot);

  ensureVaultDirTracked(config);

  const gitignorePath = path.join(repoRoot, '.gitignore');
  const gitignoreUpdated = ensureGitignoreEntry(gitignorePath);

  return {
    repoRoot,
    vaultDir: config.vaultDir,
    gitignoreUpdated,
    gitattributesUpdated: true,
  };
}

function ensureGitignoreEntry(gitignorePath: string): boolean {
  const marker = '# envault - ignore plaintext env files';
  const entries = `${marker}\n.env\n.env.*\n!.env.example\n`;

  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf8');
    if (content.includes(marker)) return false;
    fs.appendFileSync(gitignorePath, `\n${entries}`);
  } else {
    fs.writeFileSync(gitignorePath, entries);
  }

  return true;
}
