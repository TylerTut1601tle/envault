import * as fs from 'fs';
import * as path from 'path';
import { decryptVaultFile, getVaultPath, isVaultFile } from '../crypto/vault';
import { parseEnvFile } from '../env/parser';

export interface InspectResult {
  vaultPath: string;
  envFile: string;
  keyCount: number;
  keys: string[];
  sizeBytes: number;
}

export async function runInspect(
  envFile: string,
  password: string,
  cwd: string = process.cwd()
): Promise<InspectResult> {
  const vaultPath = getVaultPath(envFile, cwd);

  if (!fs.existsSync(vaultPath)) {
    throw new Error(`No vault found for '${envFile}'. Run 'envault lock ${envFile}' first.`);
  }

  if (!isVaultFile(vaultPath)) {
    throw new Error(`File '${vaultPath}' does not appear to be a valid vault.`);
  }

  const decrypted = await decryptVaultFile(vaultPath, password);
  const entries = parseEnvFile(decrypted);
  const keys = entries
    .filter((e) => e.type === 'entry')
    .map((e) => e.key as string);

  const stat = fs.statSync(vaultPath);

  return {
    vaultPath,
    envFile,
    keyCount: keys.length,
    keys,
    sizeBytes: stat.size,
  };
}

export function formatInspectResult(result: InspectResult): string {
  const lines: string[] = [
    `Vault: ${result.vaultPath}`,
    `Source: ${result.envFile}`,
    `Size: ${result.sizeBytes} bytes`,
    `Keys (${result.keyCount}):`,
    ...result.keys.map((k) => `  - ${k}`),
  ];
  return lines.join('\n');
}
