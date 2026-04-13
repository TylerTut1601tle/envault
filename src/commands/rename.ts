import * as fs from 'fs';
import * as path from 'path';
import { getVaultPath, isVaultFile } from '../crypto/vault';
import { getRepoRoot } from '../git/secrets';

export interface RenameResult {
  success: boolean;
  oldName: string;
  newName: string;
  oldVaultPath?: string;
  newVaultPath?: string;
  error?: string;
}

export function formatRenameResult(result: RenameResult): string {
  if (!result.success) {
    return `✗ Rename failed: ${result.error}`;
  }
  return [
    `✓ Renamed .env file reference`,
    `  From : ${result.oldName} (${result.oldVaultPath})`,
    `  To   : ${result.newName} (${result.newVaultPath})`,
  ].join('\n');
}

export async function runRename(
  oldEnvFile: string,
  newEnvFile: string,
  cwd: string = process.cwd()
): Promise<RenameResult> {
  const repoRoot = await getRepoRoot(cwd);
  const base = repoRoot ?? cwd;

  const oldVaultPath = getVaultPath(oldEnvFile, base);
  const newVaultPath = getVaultPath(newEnvFile, base);

  if (!fs.existsSync(oldVaultPath)) {
    return {
      success: false,
      oldName: oldEnvFile,
      newName: newEnvFile,
      error: `Vault file not found for '${oldEnvFile}'. Has it been locked yet?`,
    };
  }

  if (fs.existsSync(newVaultPath)) {
    return {
      success: false,
      oldName: oldEnvFile,
      newName: newEnvFile,
      error: `A vault already exists for '${newEnvFile}'. Choose a different name.`,
    };
  }

  const newVaultDir = path.dirname(newVaultPath);
  if (!fs.existsSync(newVaultDir)) {
    fs.mkdirSync(newVaultDir, { recursive: true });
  }

  fs.renameSync(oldVaultPath, newVaultPath);

  return {
    success: true,
    oldName: oldEnvFile,
    newName: newEnvFile,
    oldVaultPath: path.relative(base, oldVaultPath),
    newVaultPath: path.relative(base, newVaultPath),
  };
}
