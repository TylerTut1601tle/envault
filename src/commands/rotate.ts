import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { decryptVaultFile, encryptEnvFile, getVaultPath, isVaultFile } from '../crypto/vault';
import { listTrackedVaults, getRepoRoot } from '../git/secrets';

export async function rotateKey(
  envFilePath: string,
  oldPassphrase: string,
  newPassphrase: string
): Promise<void> {
  const vaultPath = getVaultPath(envFilePath);

  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault file not found: ${vaultPath}`);
  }

  // Decrypt with old passphrase
  const decrypted = await decryptVaultFile(vaultPath, oldPassphrase);

  // Re-encrypt with new passphrase
  await encryptEnvFile(envFilePath, newPassphrase, decrypted);

  console.log(`Key rotated successfully for: ${envFilePath}`);
}

export async function rotateAllKeys(
  oldPassphrase: string,
  newPassphrase: string,
  cwd: string = process.cwd()
): Promise<{ success: string[]; failed: Array<{ file: string; error: string }> }> {
  const repoRoot = await getRepoRoot(cwd);
  const trackedVaults = await listTrackedVaults(repoRoot);

  const success: string[] = [];
  const failed: Array<{ file: string; error: string }> = [];

  for (const vaultFile of trackedVaults) {
    const vaultPath = path.join(repoRoot, vaultFile);
    // Derive the original .env path from vault path
    const envFile = vaultPath.replace(/\.vault$/, '');

    try {
      const decrypted = await decryptVaultFile(vaultPath, oldPassphrase);
      await encryptEnvFile(envFile, newPassphrase, decrypted);
      success.push(vaultFile);
    } catch (err) {
      failed.push({
        file: vaultFile,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return { success, failed };
}

export function formatRotateResult(
  result: { success: string[]; failed: Array<{ file: string; error: string }> }
): string {
  const lines: string[] = [];

  if (result.success.length > 0) {
    lines.push(`✔ Rotated (${result.success.length}):`);
    result.success.forEach((f) => lines.push(`  ${f}`));
  }

  if (result.failed.length > 0) {
    lines.push(`✖ Failed (${result.failed.length}):`);
    result.failed.forEach(({ file, error }) => lines.push(`  ${file}: ${error}`));
  }

  return lines.join('\n');
}
