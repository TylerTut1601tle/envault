import * as fs from 'fs';
import * as path from 'path';
import { decryptVaultFile, getVaultPath } from '../crypto/vault';
import { parseEnvFile } from '../env/parser';

export interface HeadOptions {
  lines?: number;
  password: string;
  cwd?: string;
}

export interface HeadResult {
  entries: Array<{ key: string; value: string }>;
  vaultPath: string;
  total: number;
}

export async function runHead(envFile: string, options: HeadOptions): Promise<HeadResult> {
  const cwd = options.cwd ?? process.cwd();
  const vaultPath = getVaultPath(envFile, cwd);

  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault not found: ${vaultPath}`);
  }

  const encrypted = fs.readFileSync(vaultPath, 'utf8');
  const decrypted = await decryptVaultFile(encrypted, options.password);
  const parsed = parseEnvFile(decrypted);

  const n = options.lines ?? 10;
  const entries = parsed.entries
    .filter(e => e.type === 'entry')
    .map(e => ({ key: e.key!, value: e.value! }))
    .slice(0, n);

  return { entries, vaultPath, total: parsed.entries.filter(e => e.type === 'entry').length };
}

export function formatHeadResult(result: HeadResult, lines: number): string {
  const out: string[] = [`# ${path.basename(result.vaultPath)} (showing ${result.entries.length} of ${result.total})`, ''];
  for (const { key, value } of result.entries) {
    out.push(`${key}=${value}`);
  }
  return out.join('\n');
}
