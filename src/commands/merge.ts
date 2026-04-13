import * as fs from 'fs';
import * as path from 'path';
import { decryptVaultFile, encryptEnvFile, getVaultPath } from '../crypto/vault';
import { parseEnvFile, serializeEnvFile } from '../env/parser';

export interface MergeResult {
  added: string[];
  skipped: string[];
  updated: string[];
  outputVault: string;
}

export async function runMerge(
  sourceEnvOrVault: string,
  targetEnvName: string,
  password: string,
  overwrite = false
): Promise<MergeResult> {
  const targetVaultPath = getVaultPath(targetEnvName);

  if (!fs.existsSync(targetVaultPath)) {
    throw new Error(`Target vault not found: ${targetVaultPath}`);
  }

  const targetEntries = await decryptVaultFile(targetVaultPath, password);
  const targetMap = new Map(targetEntries.map((e) => [e.key, e]));

  let sourceContent: string;
  if (sourceEnvOrVault.endsWith('.vault')) {
    sourceContent = await decryptVaultFile(sourceEnvOrVault, password)
      .then((entries) => serializeEnvFile(entries));
  } else {
    if (!fs.existsSync(sourceEnvOrVault)) {
      throw new Error(`Source file not found: ${sourceEnvOrVault}`);
    }
    sourceContent = fs.readFileSync(sourceEnvOrVault, 'utf-8');
  }

  const sourceEntries = parseEnvFile(sourceContent);
  const added: string[] = [];
  const skipped: string[] = [];
  const updated: string[] = [];

  for (const entry of sourceEntries) {
    if (entry.key === null) continue;
    if (targetMap.has(entry.key)) {
      if (overwrite) {
        targetMap.set(entry.key, entry);
        updated.push(entry.key);
      } else {
        skipped.push(entry.key);
      }
    } else {
      targetMap.set(entry.key, entry);
      added.push(entry.key);
    }
  }

  const mergedEntries = Array.from(targetMap.values());
  const mergedContent = serializeEnvFile(mergedEntries);
  await encryptEnvFile(mergedContent, targetVaultPath, password);

  return { added, skipped, updated, outputVault: targetVaultPath };
}

export function formatMergeResult(result: MergeResult): string {
  const lines: string[] = [`Merged into vault: ${result.outputVault}`];
  if (result.added.length > 0)
    lines.push(`  Added:   ${result.added.join(', ')}`);
  if (result.updated.length > 0)
    lines.push(`  Updated: ${result.updated.join(', ')}`);
  if (result.skipped.length > 0)
    lines.push(`  Skipped: ${result.skipped.join(', ')} (use --overwrite to replace)`);
  if (result.added.length === 0 && result.updated.length === 0)
    lines.push('  No changes applied.');
  return lines.join('\n');
}
