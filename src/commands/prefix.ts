import * as fs from 'fs';
import { decryptVaultFile, getVaultPath } from '../crypto/vault';
import { parseEnvFile, serializeEnvFile } from '../env/parser';
import { encryptEnvFile } from '../crypto/vault';

export interface PrefixOptions {
  vaultDir?: string;
  prefix: string;
  dryRun?: boolean;
  overwrite?: boolean;
}

export interface PrefixResult {
  renamed: Array<{ from: string; to: string }>;
  skipped: Array<{ key: string; reason: string }>;
  vaultPath: string;
}

export async function runPrefix(
  envFile: string,
  options: PrefixOptions,
  password: string
): Promise<PrefixResult> {
  const vaultPath = getVaultPath(envFile, options.vaultDir);

  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault not found: ${vaultPath}`);
  }

  const decrypted = await decryptVaultFile(vaultPath, password);
  const entries = parseEnvFile(decrypted);
  const renamed: Array<{ from: string; to: string }> = [];
  const skipped: Array<{ key: string; reason: string }> = [];
  const normalizedPrefix = options.prefix.toUpperCase().replace(/[^A-Z0-9_]/g, '_');

  const newEntries = entries.map((entry) => {
    if (entry.type !== 'entry') return entry;
    const key = entry.key!;
    if (key.startsWith(normalizedPrefix)) {
      skipped.push({ key, reason: 'already has prefix' });
      return entry;
    }
    const newKey = `${normalizedPrefix}${key}`;
    const conflict = entries.find((e) => e.type === 'entry' && e.key === newKey);
    if (conflict && !options.overwrite) {
      skipped.push({ key, reason: `target key ${newKey} already exists` });
      return entry;
    }
    renamed.push({ from: key, to: newKey });
    return { ...entry, key: newKey };
  });

  if (!options.dryRun && renamed.length > 0) {
    const serialized = serializeEnvFile(newEntries);
    await encryptEnvFile(envFile, serialized, password, options.vaultDir);
  }

  return { renamed, skipped, vaultPath };
}

export function formatPrefixResult(result: PrefixResult, dryRun?: boolean): string {
  const lines: string[] = [];
  if (dryRun) lines.push('(dry run — no changes written)');
  if (result.renamed.length === 0 && result.skipped.length === 0) {
    lines.push('No keys to prefix.');
    return lines.join('\n');
  }
  for (const r of result.renamed) {
    lines.push(`  renamed: ${r.from} → ${r.to}`);
  }
  for (const s of result.skipped) {
    lines.push(`  skipped: ${s.key} (${s.reason})`);
  }
  lines.push(`\n${result.renamed.length} key(s) prefixed, ${result.skipped.length} skipped.`);
  return lines.join('\n');
}
