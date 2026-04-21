import * as fs from 'fs';
import * as path from 'path';
import { decryptVaultFile, getVaultPath } from '../crypto/vault';
import { parseEnvFile } from '../env/parser';

export interface ResolveResult {
  key: string;
  value: string | undefined;
  vaultFile: string;
  found: boolean;
}

export async function resolveKey(
  dir: string,
  envFile: string,
  key: string,
  password: string
): Promise<ResolveResult> {
  const vaultFile = getVaultPath(dir, envFile);

  if (!fs.existsSync(vaultFile)) {
    throw new Error(`Vault file not found: ${vaultFile}`);
  }

  const decrypted = await decryptVaultFile(vaultFile, password);
  const entries = parseEnvFile(decrypted);
  const entry = entries.find((e) => e.key === key);

  return {
    key,
    value: entry?.value,
    vaultFile: path.relative(dir, vaultFile),
    found: entry !== undefined,
  };
}

export function formatResolveResult(result: ResolveResult): string {
  if (!result.found) {
    return `Key "${result.key}" not found in ${result.vaultFile}`;
  }
  return result.value ?? '';
}
