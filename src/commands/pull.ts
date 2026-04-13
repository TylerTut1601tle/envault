import * as fs from 'fs';
import * as path from 'path';
import { getRepoRoot, listTrackedVaults } from '../git/secrets';
import { decryptVaultFile, getVaultPath, isVaultFile } from '../crypto/vault';

export interface PullResult {
  pulled: string[];
  skipped: string[];
  errors: { file: string; error: string }[];
}

export async function pullVaults(
  passphrase: string,
  targetDir: string = process.cwd()
): Promise<PullResult> {
  const result: PullResult = { pulled: [], skipped: [], errors: [] };

  const repoRoot = await getRepoRoot(targetDir);
  const vaults = await listTrackedVaults(repoRoot);

  for (const vaultPath of vaults) {
    if (!isVaultFile(vaultPath)) {
      result.skipped.push(vaultPath);
      continue;
    }

    try {
      const vaultContent = fs.readFileSync(vaultPath, 'utf-8');
      const envPath = vaultPath.replace(/\.vault$/, '');
      const decrypted = await decryptVaultFile(vaultContent, passphrase);
      fs.writeFileSync(envPath, decrypted, 'utf-8');
      result.pulled.push(path.relative(repoRoot, envPath));
    } catch (err: any) {
      result.errors.push({ file: vaultPath, error: err.message });
    }
  }

  return result;
}

export function formatPullResult(result: PullResult): string {
  const lines: string[] = [];

  if (result.pulled.length > 0) {
    lines.push(`✅ Pulled ${result.pulled.length} vault(s):`);
    result.pulled.forEach(f => lines.push(`   • ${f}`));
  }

  if (result.skipped.length > 0) {
    lines.push(`⏭  Skipped ${result.skipped.length} file(s) (not vault files).`);
  }

  if (result.errors.length > 0) {
    lines.push(`❌ Errors:`);
    result.errors.forEach(e => lines.push(`   • ${e.file}: ${e.error}`));
  }

  if (lines.length === 0) {
    lines.push('ℹ️  No vaults found to pull.');
  }

  return lines.join('\n');
}
