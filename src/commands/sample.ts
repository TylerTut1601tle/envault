import * as fs from 'fs';
import * as path from 'path';
import { decryptVaultFile, getVaultPath } from '../crypto/vault';
import { parseEnvFile } from '../env/parser';

export interface SampleOptions {
  count?: number;
  keys?: string[];
  redact?: boolean;
}

export interface SampleResult {
  vaultPath: string;
  envFile: string;
  sampled: Record<string, string>;
  total: number;
}

export async function runSample(
  dir: string,
  envFile: string,
  password: string,
  options: SampleOptions = {}
): Promise<SampleResult> {
  const vaultPath = getVaultPath(dir, envFile);

  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault not found: ${vaultPath}`);
  }

  const decrypted = await decryptVaultFile(vaultPath, password);
  const entries = parseEnvFile(decrypted);

  const allKeys = Object.keys(entries);
  const { count = 3, keys, redact = false } = options;

  let selectedKeys: string[];
  if (keys && keys.length > 0) {
    selectedKeys = keys.filter((k) => allKeys.includes(k));
  } else {
    // Pick `count` keys at random
    const shuffled = [...allKeys].sort(() => Math.random() - 0.5);
    selectedKeys = shuffled.slice(0, Math.min(count, allKeys.length));
  }

  const sampled: Record<string, string> = {};
  for (const key of selectedKeys) {
    sampled[key] = redact ? '***' : entries[key];
  }

  return {
    vaultPath,
    envFile,
    sampled,
    total: allKeys.length,
  };
}

export function formatSampleResult(result: SampleResult): string {
  const lines: string[] = [
    `Vault: ${result.vaultPath}`,
    `Sampled ${Object.keys(result.sampled).length} of ${result.total} keys:`,
    '',
  ];

  for (const [key, value] of Object.entries(result.sampled)) {
    lines.push(`  ${key}=${value}`);
  }

  return lines.join('\n');
}
