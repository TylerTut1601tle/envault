import * as fs from 'fs';
import { decryptVaultFile, getVaultPath } from '../crypto/vault';
import { parseEnvFile } from '../env/parser';

export interface UniqueResult {
  vault: string;
  totalKeys: number;
  uniqueKeys: string[];
  duplicateKeys: string[];
}

export async function getUniqueKeys(
  dir: string,
  vaultName: string,
  password: string
): Promise<UniqueResult> {
  const vaultPath = getVaultPath(dir, vaultName);

  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault not found: ${vaultName}`);
  }

  const decrypted = await decryptVaultFile(vaultPath, password);
  const entries = parseEnvFile(decrypted);

  const seen = new Map<string, number>();
  for (const entry of entries) {
    if (entry.type === 'entry') {
      seen.set(entry.key, (seen.get(entry.key) ?? 0) + 1);
    }
  }

  const uniqueKeys: string[] = [];
  const duplicateKeys: string[] = [];

  for (const [key, count] of seen.entries()) {
    if (count === 1) {
      uniqueKeys.push(key);
    } else {
      duplicateKeys.push(key);
    }
  }

  return {
    vault: vaultName,
    totalKeys: seen.size,
    uniqueKeys: uniqueKeys.sort(),
    duplicateKeys: duplicateKeys.sort(),
  };
}

export function formatUniqueResult(result: UniqueResult): string {
  const lines: string[] = [];
  lines.push(`Vault: ${result.vault}`);
  lines.push(`Total keys: ${result.totalKeys}`);

  if (result.duplicateKeys.length > 0) {
    lines.push(`\nDuplicate keys (${result.duplicateKeys.length}):`);
    for (const key of result.duplicateKeys) {
      lines.push(`  ! ${key}`);
    }
  } else {
    lines.push('\nNo duplicate keys found.');
  }

  lines.push(`\nUnique keys (${result.uniqueKeys.length}):`);
  for (const key of result.uniqueKeys) {
    lines.push(`  - ${key}`);
  }

  return lines.join('\n');
}
