import * as fs from 'fs';
import { decryptVaultFile, getVaultPath } from '../crypto/vault';
import { parseEnvFile } from '../env/parser';

export interface GetResult {
  key: string;
  value: string | undefined;
  found: boolean;
  vaultFile: string;
}

export async function runGet(
  envFile: string,
  key: string,
  password: string,
  dir: string = process.cwd()
): Promise<GetResult> {
  const vaultPath = getVaultPath(envFile, dir);

  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault file not found: ${vaultPath}`);
  }

  const encrypted = fs.readFileSync(vaultPath, 'utf-8');
  const decrypted = await decryptVaultFile(encrypted, password);
  const entries = parseEnvFile(decrypted);

  const entry = entries.find((e) => e.key === key);

  return {
    key,
    value: entry?.value,
    found: entry !== undefined,
    vaultFile: vaultPath,
  };
}

export function formatGetResult(result: GetResult, raw: boolean = false): string {
  if (!result.found) {
    return `Key "${result.key}" not found in ${result.vaultFile}`;
  }
  if (raw) {
    return result.value ?? '';
  }
  return `${result.key}=${result.value}`;
}
