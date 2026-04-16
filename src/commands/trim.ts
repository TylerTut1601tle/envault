import * as fs from 'fs';
import { decryptVaultFile, encryptEnvFile, getVaultPath } from '../crypto/vault';
import { parseEnvFile, serializeEnvFile } from '../env/parser';

export interface TrimResult {
  vaultPath: string;
  removed: string[];
  total: number;
}

export async function trimVault(
  dir: string,
  name: string,
  password: string
): Promise<TrimResult> {
  const vaultPath = getVaultPath(dir, name);
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault not found: ${vaultPath}`);
  }

  const decrypted = await decryptVaultFile(vaultPath, password);
  const entries = parseEnvFile(decrypted);

  const removed: string[] = [];
  const trimmed = entries.filter(entry => {
    if (entry.type === 'entry') {
      const hasEmptyKey = !entry.key || entry.key.trim() === '';
      const hasEmptyValue = entry.value === undefined || entry.value === '';
      if (hasEmptyKey || hasEmptyValue) {
        removed.push(entry.key || '(empty)');
        return false;
      }
    }
    return true;
  });

  const serialized = serializeEnvFile(trimmed);
  await encryptEnvFile(vaultPath, serialized, password);

  return { vaultPath, removed, total: trimmed.filter(e => e.type === 'entry').length };
}

export function formatTrimResult(result: TrimResult): string {
  const lines: string[] = [`Vault: ${result.vaultPath}`];
  if (result.removed.length === 0) {
    lines.push('No empty entries found.');
  } else {
    lines.push(`Removed ${result.removed.length} empty entry(ies):`);
    for (const key of result.removed) {
      lines.push(`  - ${key}`);
    }
  }
  lines.push(`Remaining entries: ${result.total}`);
  return lines.join('\n');
}
