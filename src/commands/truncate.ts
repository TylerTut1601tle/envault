import * as fs from 'fs';
import { decryptVaultFile, encryptEnvFile, getVaultPath, isVaultFile } from '../crypto/vault';
import { parseEnvFile, serializeEnvFile } from '../env/parser';

export interface TruncateOptions {
  file: string;
  keep: number;
  password: string;
  repoRoot: string;
}

export interface TruncateResult {
  file: string;
  originalCount: number;
  keptCount: number;
  removedCount: number;
}

export async function runTruncate(opts: TruncateOptions): Promise<TruncateResult> {
  const { file, keep, password, repoRoot } = opts;

  if (keep < 0) throw new Error('--keep must be a non-negative integer');

  const vaultPath = isVaultFile(file) ? file : getVaultPath(repoRoot, file);
  if (!fs.existsSync(vaultPath)) throw new Error(`Vault not found: ${vaultPath}`);

  const decrypted = await decryptVaultFile(vaultPath, password);
  const entries = parseEnvFile(decrypted);

  const keys = Object.keys(entries);
  const originalCount = keys.length;

  if (keep >= originalCount) {
    return { file, originalCount, keptCount: originalCount, removedCount: 0 };
  }

  const keptKeys = keys.slice(0, keep);
  const keptEntries: Record<string, string> = {};
  for (const k of keptKeys) keptEntries[k] = entries[k];

  const serialized = serializeEnvFile(keptEntries);
  const outPath = getVaultPath(repoRoot, file);
  await encryptEnvFile(serialized, outPath, password);

  return {
    file,
    originalCount,
    keptCount: keep,
    removedCount: originalCount - keep,
  };
}

export function formatTruncateResult(result: TruncateResult): string {
  if (result.removedCount === 0) {
    return `✔ No keys removed from ${result.file} (${result.originalCount} keys kept)`;
  }
  return `✔ Truncated ${result.file}: kept ${result.keptCount}/${result.originalCount} keys, removed ${result.removedCount}`;
}
