import * as fs from 'fs';
import { decryptVaultFile, getVaultPath, isVaultFile } from '../crypto/vault';
import { parseEnvFile } from '../env/parser';

export interface SummarizeResult {
  vaultPath: string;
  totalKeys: number;
  emptyValues: number;
  commentLines: number;
  uniquePrefixes: string[];
  estimatedSize: number;
}

export async function summarizeVault(
  envFile: string,
  password: string,
  dir: string = process.cwd()
): Promise<SummarizeResult> {
  const vaultPath = isVaultFile(envFile) ? envFile : getVaultPath(envFile, dir);

  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault not found: ${vaultPath}`);
  }

  const raw = fs.readFileSync(vaultPath, 'utf-8');
  const decrypted = await decryptVaultFile(raw, password);
  const entries = parseEnvFile(decrypted);

  const keys = entries.filter((e) => e.type === 'entry');
  const comments = entries.filter((e) => e.type === 'comment');
  const emptyValues = keys.filter((e) => e.type === 'entry' && e.value === '').length;

  const prefixSet = new Set<string>();
  for (const entry of keys) {
    if (entry.type === 'entry') {
      const match = entry.key.match(/^([A-Z][A-Z0-9]*)_/);
      if (match) prefixSet.add(match[1]);
    }
  }

  return {
    vaultPath,
    totalKeys: keys.length,
    emptyValues,
    commentLines: comments.length,
    uniquePrefixes: Array.from(prefixSet).sort(),
    estimatedSize: Buffer.byteLength(decrypted, 'utf-8'),
  };
}

export function formatSummarizeResult(result: SummarizeResult): string {
  const lines: string[] = [
    `Vault:          ${result.vaultPath}`,
    `Total keys:     ${result.totalKeys}`,
    `Empty values:   ${result.emptyValues}`,
    `Comment lines:  ${result.commentLines}`,
    `Prefixes:       ${result.uniquePrefixes.length > 0 ? result.uniquePrefixes.join(', ') : '(none)'}`,
    `Decrypted size: ${result.estimatedSize} bytes`,
  ];
  return lines.join('\n');
}
