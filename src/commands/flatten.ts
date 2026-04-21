import * as fs from 'fs';
import { decryptVaultFile, getVaultPath } from '../crypto/vault';
import { parseEnvFile } from '../env/parser';

export interface FlattenResult {
  output: string;
  keyCount: number;
  sourceFiles: string[];
}

/**
 * Flattens multiple vault files into a single merged .env output.
 * Later files take precedence over earlier ones for duplicate keys.
 */
export async function flattenVaults(
  dir: string,
  names: string[],
  password: string
): Promise<FlattenResult> {
  const merged: Record<string, string> = {};
  const sourceFiles: string[] = [];

  for (const name of names) {
    const vaultPath = getVaultPath(dir, name);
    if (!fs.existsSync(vaultPath)) {
      throw new Error(`Vault not found: ${name} (expected at ${vaultPath})`);
    }
    const decrypted = await decryptVaultFile(vaultPath, password);
    const entries = parseEnvFile(decrypted);
    for (const { key, value } of entries) {
      if (key) merged[key] = value ?? '';
    }
    sourceFiles.push(vaultPath);
  }

  const lines = Object.entries(merged).map(
    ([k, v]) => `${k}=${v.includes(' ') || v.includes('=') ? `"${v}"` : v}`
  );
  const output = lines.join('\n') + (lines.length > 0 ? '\n' : '');

  return { output, keyCount: Object.keys(merged).length, sourceFiles };
}

export function formatFlattenResult(result: FlattenResult): string {
  const lines: string[] = [];
  lines.push(`✔ Flattened ${result.sourceFiles.length} vault(s) → ${result.keyCount} key(s)`);
  for (const src of result.sourceFiles) {
    lines.push(`  • ${src}`);
  }
  lines.push('');
  lines.push(result.output);
  return lines.join('\n');
}
