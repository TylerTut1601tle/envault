import * as fs from 'fs';
import * as path from 'path';
import { getVaultPath, isVaultFile } from '../crypto/vault';
import { decryptVaultFile } from '../crypto/vault';

export interface KeysResult {
  vault: string;
  keys: string[];
  count: number;
}

export async function listVaultKeys(
  dir: string,
  vaultName: string,
  password: string
): Promise<KeysResult> {
  const vaultPath = getVaultPath(dir, vaultName);
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault not found: ${vaultName}`);
  }
  const entries = await decryptVaultFile(vaultPath, password);
  const keys = entries.map((e) => e.key);
  return { vault: vaultName, keys, count: keys.length };
}

export function formatKeysResult(result: KeysResult): string {
  if (result.count === 0) {
    return `Vault "${result.vault}" has no keys.`;
  }
  const lines = result.keys.map((k) => `  - ${k}`);
  return [
    `Keys in vault "${result.vault}" (${result.count}):`,
    ...lines,
  ].join('\n');
}
