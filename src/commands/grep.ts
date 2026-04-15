import * as fs from 'fs';
import { decryptVaultFile, getVaultPath } from '../crypto/vault';
import { parseEnvFile } from '../env/parser';

export interface GrepMatch {
  key: string;
  value: string;
  vault: string;
}

export interface GrepResult {
  matches: GrepMatch[];
  vaultsSearched: number;
  error?: string;
}

export async function grepVaults(
  pattern: string,
  vaultNames: string[],
  password: string,
  dir: string,
  searchValues = false
): Promise<GrepResult> {
  const matches: GrepMatch[] = [];
  let vaultsSearched = 0;

  let regex: RegExp;
  try {
    regex = new RegExp(pattern, 'i');
  } catch {
    return { matches: [], vaultsSearched: 0, error: `Invalid regex pattern: ${pattern}` };
  }

  for (const name of vaultNames) {
    const vaultPath = getVaultPath(dir, name);
    if (!fs.existsSync(vaultPath)) continue;

    try {
      const decrypted = await decryptVaultFile(vaultPath, password);
      const entries = parseEnvFile(decrypted);
      vaultsSearched++;

      for (const [key, value] of Object.entries(entries)) {
        const keyMatch = regex.test(key);
        const valueMatch = searchValues && regex.test(value);
        if (keyMatch || valueMatch) {
          matches.push({ key, value, vault: name });
        }
      }
    } catch {
      // skip vaults that fail to decrypt
    }
  }

  return { matches, vaultsSearched };
}

export function formatGrepResult(result: GrepResult, showValues = false): string {
  if (result.error) return `Error: ${result.error}`;
  if (result.matches.length === 0) {
    return `No matches found (searched ${result.vaultsSearched} vault(s)).`;
  }

  const lines: string[] = [`Found ${result.matches.length} match(es) in ${result.vaultsSearched} vault(s):\n`];
  for (const m of result.matches) {
    const val = showValues ? `=${m.value}` : '';
    lines.push(`  [${m.vault}] ${m.key}${val}`);
  }
  return lines.join('\n');
}
