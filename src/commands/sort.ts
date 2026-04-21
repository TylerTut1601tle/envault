import * as fs from 'fs';
import { decryptVaultFile, getVaultPath, isVaultFile } from '../crypto/vault';
import { parseEnvFile, serializeEnvFile } from '../env/parser';
import { encryptEnvFile } from '../crypto/vault';

export interface SortOptions {
  reverse?: boolean;
  byValue?: boolean;
}

export interface SortResult {
  vaultPath: string;
  keyCount: number;
  changed: boolean;
}

export function formatSortResult(result: SortResult): string {
  if (!result.changed) {
    return `ℹ️  ${result.vaultPath} is already sorted (${result.keyCount} keys)`;
  }
  return `✅ Sorted ${result.keyCount} keys in ${result.vaultPath}`;
}

export async function runSort(
  envFile: string,
  password: string,
  options: SortOptions = {}
): Promise<SortResult> {
  const vaultPath = isVaultFile(envFile) ? envFile : getVaultPath(envFile);

  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault file not found: ${vaultPath}`);
  }

  const decrypted = await decryptVaultFile(vaultPath, password);
  const entries = parseEnvFile(decrypted);

  const originalKeys = entries
    .filter(e => e.type === 'entry')
    .map(e => e.key);

  const sorted = [...entries].sort((a, b) => {
    if (a.type !== 'entry' || b.type !== 'entry') return 0;
    const aVal = options.byValue ? (a.value ?? '') : (a.key ?? '');
    const bVal = options.byValue ? (b.value ?? '') : (b.key ?? '');
    const cmp = aVal.localeCompare(bVal);
    return options.reverse ? -cmp : cmp;
  });

  const sortedKeys = sorted
    .filter(e => e.type === 'entry')
    .map(e => e.key);

  const changed = JSON.stringify(originalKeys) !== JSON.stringify(sortedKeys);

  if (changed) {
    const serialized = serializeEnvFile(sorted);
    await encryptEnvFile(envFile, serialized, password);
  }

  return {
    vaultPath,
    keyCount: sortedKeys.length,
    changed,
  };
}
