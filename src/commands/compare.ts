import * as fs from 'fs';
import { decryptVaultFile, getVaultPath } from '../crypto/vault';
import { parseEnvFile } from '../env/parser';

export interface CompareResult {
  onlyInA: string[];
  onlyInB: string[];
  different: string[];
  same: string[];
}

export function compareEnvMaps(
  a: Record<string, string>,
  b: Record<string, string>
): CompareResult {
  const keysA = new Set(Object.keys(a));
  const keysB = new Set(Object.keys(b));
  const allKeys = new Set([...keysA, ...keysB]);

  const onlyInA: string[] = [];
  const onlyInB: string[] = [];
  const different: string[] = [];
  const same: string[] = [];

  for (const key of allKeys) {
    if (!keysB.has(key)) onlyInA.push(key);
    else if (!keysA.has(key)) onlyInB.push(key);
    else if (a[key] !== b[key]) different.push(key);
    else same.push(key);
  }

  return { onlyInA, onlyInB, different, same };
}

export async function runCompare(
  envNameA: string,
  envNameB: string,
  password: string,
  repoRoot: string
): Promise<CompareResult> {
  const vaultA = getVaultPath(repoRoot, envNameA);
  const vaultB = getVaultPath(repoRoot, envNameB);

  if (!fs.existsSync(vaultA)) throw new Error(`Vault not found: ${envNameA}`);
  if (!fs.existsSync(vaultB)) throw new Error(`Vault not found: ${envNameB}`);

  const contentA = await decryptVaultFile(vaultA, password);
  const contentB = await decryptVaultFile(vaultB, password);

  const mapA = Object.fromEntries(parseEnvFile(contentA).map(e => [e.key, e.value ?? '']));
  const mapB = Object.fromEntries(parseEnvFile(contentB).map(e => [e.key, e.value ?? '']));

  return compareEnvMaps(mapA, mapB);
}

export function formatCompareResult(
  result: CompareResult,
  nameA: string,
  nameB: string
): string {
  const lines: string[] = [`Comparing ${nameA} ↔ ${nameB}\n`];

  if (result.onlyInA.length > 0)
    lines.push(`Only in ${nameA}:\n` + result.onlyInA.map(k => `  - ${k}`).join('\n'));
  if (result.onlyInB.length > 0)
    lines.push(`Only in ${nameB}:\n` + result.onlyInB.map(k => `  + ${k}`).join('\n'));
  if (result.different.length > 0)
    lines.push(`Different values:\n` + result.different.map(k => `  ~ ${k}`).join('\n'));
  if (result.same.length > 0)
    lines.push(`Same (${result.same.length} key${result.same.length === 1 ? '' : 's'})`);

  if (result.onlyInA.length === 0 && result.onlyInB.length === 0 && result.different.length === 0)
    lines.push('✓ Vaults are identical');

  return lines.join('\n');
}
