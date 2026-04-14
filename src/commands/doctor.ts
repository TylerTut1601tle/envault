import * as fs from 'fs';
import * as path from 'path';
import { isGitRepo, getRepoRoot } from '../git/secrets';
import { isInitialized } from './init';
import { listTrackedVaults } from '../git/secrets';
import { isVaultFile } from '../crypto/vault';

export interface DoctorCheck {
  name: string;
  status: 'ok' | 'warn' | 'error';
  message: string;
}

export interface DoctorResult {
  checks: DoctorCheck[];
  allOk: boolean;
}

export async function runDoctor(cwd: string): Promise<DoctorResult> {
  const checks: DoctorCheck[] = [];

  // Check 1: Is a git repo
  const gitRepo = await isGitRepo(cwd);
  checks.push({
    name: 'git-repo',
    status: gitRepo ? 'ok' : 'error',
    message: gitRepo ? 'Directory is a Git repository' : 'Not a Git repository — run git init first',
  });

  // Check 2: Is envault initialized
  const initialized = isInitialized(cwd);
  checks.push({
    name: 'envault-init',
    status: initialized ? 'ok' : 'warn',
    message: initialized ? 'envault is initialized (.envault directory found)' : 'envault not initialized — run envault init',
  });

  // Check 3: .env is gitignored
  const gitignorePath = path.join(cwd, '.gitignore');
  let envIgnored = false;
  if (fs.existsSync(gitignorePath)) {
    const content = fs.readFileSync(gitignorePath, 'utf8');
    envIgnored = content.split('\n').some(line => line.trim() === '.env' || line.trim() === '*.env');
  }
  checks.push({
    name: 'env-gitignored',
    status: envIgnored ? 'ok' : 'warn',
    message: envIgnored ? '.env is listed in .gitignore' : '.env may not be gitignored — secrets could be committed',
  });

  // Check 4: Vault directory exists
  const vaultDir = path.join(cwd, '.envault', 'vaults');
  const vaultDirExists = fs.existsSync(vaultDir);
  checks.push({
    name: 'vault-dir',
    status: vaultDirExists ? 'ok' : 'warn',
    message: vaultDirExists ? 'Vault directory exists' : 'No vault directory found — no vaults have been locked yet',
  });

  // Check 5: Any tracked vaults present
  if (gitRepo && initialized) {
    const vaults = await listTrackedVaults(cwd);
    checks.push({
      name: 'tracked-vaults',
      status: vaults.length > 0 ? 'ok' : 'warn',
      message: vaults.length > 0 ? `${vaults.length} tracked vault(s) found` : 'No tracked vaults found',
    });
  }

  const allOk = checks.every(c => c.status === 'ok');
  return { checks, allOk };
}

export function formatDoctorResult(result: DoctorResult): string {
  const icons: Record<string, string> = { ok: '✔', warn: '⚠', error: '✖' };
  const lines = result.checks.map(c => `  ${icons[c.status]} [${c.status.toUpperCase()}] ${c.message}`);
  const summary = result.allOk ? '\nAll checks passed.' : '\nSome checks need attention.';
  return ['envault doctor:', ...lines, summary].join('\n');
}
