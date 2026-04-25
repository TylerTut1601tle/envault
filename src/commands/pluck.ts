import * as fs from 'fs';
import { decryptVaultFile, getVaultPath } from '../crypto/vault';
import { parseEnvFile } from '../env/parser';

export interface PluckResult {
  found: Record<string, string>;
  missing: string[];
  vaultPath: string;
}

export async function pluckKeys(
  dir: string,
  envFile: string,
  keys: string[],
  password: string
): Promise<PluckResult> {
  const vaultPath = getVaultPath(dir, envFile);

  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault not found: ${vaultPath}`);
  }

  const encrypted = fs.readFileSync(vaultPath, 'utf-8');
  const decrypted = await decryptVaultFile(encrypted, password);
  const entries = parseEnvFile(decrypted);
  const envMap: Record<string, string> = {};
  for (const entry of entries) {
    if (entry.type === 'entry') {
      envMap[entry.key] = entry.value;
    }
  }

  const found: Record<string, string> = {};
  const missing: string[] = [];

  for (const key of keys) {
    if (key in envMap) {
      found[key] = envMap[key];
    } else {
      missing.push(key);
    }
  }

  return { found, missing, vaultPath };
}

export function formatPluckResult(result: PluckResult): string {
  const lines: string[] = [];

  if (Object.keys(result.found).length > 0) {
    lines.push('Plucked keys:');
    for (const [key, value] of Object.entries(result.found)) {
      lines.push(`  ${key}=${value}`);
    }
  }

  if (result.missing.length > 0) {
    lines.push('Missing keys:');
    for (const key of result.missing) {
      lines.push(`  ${key}`);
    }
  }

  return lines.join('\n');
}
