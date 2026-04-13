import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface GitSecretsConfig {
  vaultDir: string;
  gitAttributesPath: string;
}

export function getDefaultConfig(repoRoot: string): GitSecretsConfig {
  return {
    vaultDir: path.join(repoRoot, '.envault'),
    gitAttributesPath: path.join(repoRoot, '.gitattributes'),
  };
}

export function getRepoRoot(): string {
  try {
    return execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
  } catch {
    throw new Error('Not inside a Git repository.');
  }
}

export function ensureVaultDirTracked(config: GitSecretsConfig): void {
  const { vaultDir, gitAttributesPath } = config;

  if (!fs.existsSync(vaultDir)) {
    fs.mkdirSync(vaultDir, { recursive: true });
  }

  const marker = '# envault';
  const entry = `${marker}\n.envault/*.vault binary\n`;

  if (fs.existsSync(gitAttributesPath)) {
    const content = fs.readFileSync(gitAttributesPath, 'utf8');
    if (!content.includes(marker)) {
      fs.appendFileSync(gitAttributesPath, `\n${entry}`);
    }
  } else {
    fs.writeFileSync(gitAttributesPath, entry);
  }
}

export function listTrackedVaults(vaultDir: string): string[] {
  if (!fs.existsSync(vaultDir)) return [];
  return fs.readdirSync(vaultDir).filter((f) => f.endsWith('.vault'));
}

export function isGitRepo(dir: string): boolean {
  try {
    execSync('git rev-parse --git-dir', { cwd: dir, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
