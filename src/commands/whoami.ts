import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { getRepoRoot } from '../git/secrets';

export interface WhoamiInfo {
  configPath: string;
  hasPassword: boolean;
  gitUser?: string;
  gitEmail?: string;
  repoRoot?: string;
}

function getGitConfig(key: string): string | undefined {
  try {
    const { execSync } = require('child_process');
    return execSync(`git config --get ${key}`, { encoding: 'utf8' }).trim();
  } catch {
    return undefined;
  }
}

export function getWhoamiInfo(cwd: string = process.cwd()): WhoamiInfo {
  const configPath = path.join(os.homedir(), '.envault', 'config.json');
  const hasPassword = fs.existsSync(configPath);

  let repoRoot: string | undefined;
  try {
    repoRoot = getRepoRoot(cwd);
  } catch {
    repoRoot = undefined;
  }

  return {
    configPath,
    hasPassword,
    gitUser: getGitConfig('user.name'),
    gitEmail: getGitConfig('user.email'),
    repoRoot,
  };
}

export function formatWhoamiResult(info: WhoamiInfo): string {
  const lines: string[] = [];
  lines.push('envault identity:');
  if (info.gitUser) lines.push(`  git user:   ${info.gitUser}`);
  if (info.gitEmail) lines.push(`  git email:  ${info.gitEmail}`);
  lines.push(`  config:     ${info.configPath}`);
  lines.push(`  password:   ${info.hasPassword ? 'stored' : 'not stored'}`);
  if (info.repoRoot) {
    lines.push(`  repo root:  ${info.repoRoot}`);
  } else {
    lines.push('  repo root:  (not in a git repo)');
  }
  return lines.join('\n');
}

export function runWhoami(cwd: string = process.cwd()): string {
  const info = getWhoamiInfo(cwd);
  return formatWhoamiResult(info);
}
