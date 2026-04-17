import * as fs from 'fs';
import { decryptVaultFile, getVaultPath } from '../crypto/vault';
import { parseEnvFile } from '../env/parser';

export interface CountResult {
  vault: string;
  total: number;
  empty: number;
  commented: number;
  set: number;
}

export async function countEnvKeys(
  dir: string,
  name: string,
  password: string
): Promise<CountResult> {
  const vaultPath = getVaultPath(dir, name);
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault not found: ${name}`);
  }

  const encrypted = fs.readFileSync(vaultPath, 'utf-8');
  const decrypted = await decryptVaultFile(encrypted, password);
  const entries = parseEnvFile(decrypted);

  let empty = 0;
  let set = 0;

  for (const entry of entries) {
    if (entry.type === 'entry') {
      if (entry.value === '' || entry.value === undefined) {
        empty++;
      } else {
        set++;
      }
    }
  }

  const commented = entries.filter(e => e.type === 'comment').length;

  return {
    vault: name,
    total: set + empty,
    empty,
    commented,
    set,
  };
}

export function formatCountResult(result: CountResult): string {
  const lines: string[] = [
    `Vault: ${result.vault}`,
    `  Keys (set):     ${result.set}`,
    `  Keys (empty):   ${result.empty}`,
    `  Total keys:     ${result.total}`,
    `  Comment lines:  ${result.commented}`,
  ];
  return lines.join('\n');
}
