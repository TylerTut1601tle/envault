import * as fs from 'fs';
import { decryptVaultFile, getVaultPath } from '../crypto/vault';
import { parseEnvFile, serializeEnvFile } from '../env/parser';

export interface SliceOptions {
  keys: string[];
  output?: string;
  password: string;
}

export interface SliceResult {
  sliced: Record<string, string>;
  outputPath?: string;
  count: number;
}

export async function runSlice(
  vaultPath: string,
  opts: SliceOptions
): Promise<SliceResult> {
  const resolvedVault = getVaultPath(vaultPath);
  if (!fs.existsSync(resolvedVault)) {
    throw new Error(`Vault not found: ${resolvedVault}`);
  }

  const decrypted = await decryptVaultFile(resolvedVault, opts.password);
  const entries = parseEnvFile(decrypted);

  const sliced: Record<string, string> = {};
  for (const key of opts.keys) {
    if (key in entries) {
      sliced[key] = entries[key];
    }
  }

  if (Object.keys(sliced).length === 0) {
    throw new Error(`None of the specified keys were found in ${vaultPath}`);
  }

  let outputPath: string | undefined;
  if (opts.output) {
    const content = serializeEnvFile(sliced);
    fs.writeFileSync(opts.output, content, 'utf-8');
    outputPath = opts.output;
  }

  return {
    sliced,
    outputPath,
    count: Object.keys(sliced).length,
  };
}

export function formatSliceResult(result: SliceResult): string {
  const lines: string[] = [];
  lines.push(`Sliced ${result.count} key(s):`);
  for (const [k, v] of Object.entries(result.sliced)) {
    lines.push(`  ${k}=${v}`);
  }
  if (result.outputPath) {
    lines.push(`Written to: ${result.outputPath}`);
  }
  return lines.join('\n');
}
