import * as fs from 'fs';
import * as path from 'path';
import { decryptVaultFile, getVaultPath } from '../crypto/vault';
import { parseEnvFile } from '../env/parser';
import { listTrackedVaults } from '../git/secrets';

export interface SearchMatch {
  vault: string;
  key: string;
  value?: string;
}

export interface SearchResult {
  matches: SearchMatch[];
  vaultsSearched: number;
  error?: string;
}

export function formatSearchResult(result: SearchResult, showValues: boolean): string {
  if (result.error) {
    return `Error: ${result.error}`;
  }
  if (result.matches.length === 0) {
    return `No matches found (searched ${result.vaultsSearched} vault(s))`;
  }
  const lines = [`Found ${result.matches.length} match(es) across ${result.vaultsSearched} vault(s):\n`];
  for (const match of result.matches) {
    if (showValues && match.value !== undefined) {
      lines.push(`  [${match.vault}] ${match.key}=${match.value}`);
    } else {
      lines.push(`  [${match.vault}] ${match.key}`);
    }
  }
  return lines.join('\n');
}

export async function runSearch(
  repoRoot: string,
  query: string,
  password: string,
  showValues: boolean
): Promise<SearchResult> {
  const vaults = await listTrackedVaults(repoRoot);
  if (vaults.length === 0) {
    return { matches: [], vaultsSearched: 0, error: 'No tracked vaults found' };
  }

  const matches: SearchMatch[] = [];
  const lowerQuery = query.toLowerCase();

  for (const vaultName of vaults) {
    const vaultPath = getVaultPath(repoRoot, vaultName);
    if (!fs.existsSync(vaultPath)) continue;

    try {
      const decrypted = await decryptVaultFile(vaultPath, password);
      const entries = parseEnvFile(decrypted);
      for (const [key, value] of Object.entries(entries)) {
        const keyMatches = key.toLowerCase().includes(lowerQuery);
        const valueMatches = showValues && typeof value === 'string' && value.toLowerCase().includes(lowerQuery);
        if (keyMatches || valueMatches) {
          matches.push({ vault: vaultName, key, value: showValues ? String(value) : undefined });
        }
      }
    } catch {
      // skip vaults that fail to decrypt
    }
  }

  return { matches, vaultsSearched: vaults.length };
}
