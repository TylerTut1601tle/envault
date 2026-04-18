import * as fs from 'fs';
import { decryptVaultFile, getVaultPath } from '../crypto/vault';
import { parseEnvFile, serializeEnvFile } from '../env/parser';

export interface StripOptions {
  vault: string;
  password: string;
  keys: string[];
  dryRun?: boolean;
}

export interface StripResult {
  stripped: string[];
  notFound: string[];
  outputPath: string;
  dryRun: boolean;
}

export async function runStrip(options: StripOptions): Promise<StripResult> {
  const vaultPath = getVaultPath(options.vault);
  const decrypted = await decryptVaultFile(vaultPath, options.password);
  const entries = parseEnvFile(decrypted);

  const stripped: string[] = [];
  const notFound: string[] = [];

  for (const key of options.keys) {
    const idx = entries.findIndex(e => e.type === 'entry' && e.key === key);
    if (idx !== -1) {
      entries.splice(idx, 1);
      stripped.push(key);
    } else {
      notFound.push(key);
    }
  }

  if (!options.dryRun && stripped.length > 0) {
    const { encryptEnvFile } = await import('../crypto/vault');
    const newContent = serializeEnvFile(entries);
    const encrypted = await encryptEnvFile(newContent, options.password);
    fs.writeFileSync(vaultPath, encrypted);
  }

  return { stripped, notFound, outputPath: vaultPath, dryRun: options.dryRun ?? false };
}

export function formatStripResult(result: StripResult): string {
  const lines: string[] = [];
  if (result.dryRun) lines.push('(dry run)');
  if (result.stripped.length > 0) {
    lines.push(`Stripped ${result.stripped.length} key(s) from ${result.outputPath}:`);
    for (const k of result.stripped) lines.push(`  - ${k}`);
  } else {
    lines.push('No keys stripped.');
  }
  if (result.notFound.length > 0) {
    lines.push(`Not found: ${result.notFound.join(', ')}`);
  }
  return lines.join('\n');
}
