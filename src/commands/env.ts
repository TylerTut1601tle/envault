import * as fs from 'fs';
import * as path from 'path';
import { decryptVaultFile, getVaultPath } from '../crypto/vault';
import { parseEnvFile } from '../env/parser';

export interface EnvResult {
  vars: Record<string, string>;
  vaultFile: string;
  envName: string;
}

export interface FormatEnvResult {
  success: boolean;
  message: string;
  vars?: Record<string, string>;
}

export async function loadEnvVars(
  repoRoot: string,
  envName: string,
  password: string
): Promise<EnvResult> {
  const vaultFile = getVaultPath(repoRoot, envName);

  if (!fs.existsSync(vaultFile)) {
    throw new Error(`Vault not found: ${vaultFile}`);
  }

  const decrypted = await decryptVaultFile(vaultFile, password);
  const entries = parseEnvFile(decrypted);

  const vars: Record<string, string> = {};
  for (const entry of entries) {
    if (entry.type === 'entry') {
      vars[entry.key] = entry.value;
    }
  }

  return { vars, vaultFile, envName };
}

export function formatEnvResult(
  result: EnvResult,
  format: 'export' | 'dotenv' | 'json'
): FormatEnvResult {
  const { vars, envName } = result;
  const count = Object.keys(vars).length;

  if (count === 0) {
    return {
      success: true,
      message: `No variables found in vault "${envName}".`,
      vars: {}
    };
  }

  let output = '';

  if (format === 'export') {
    output = Object.entries(vars)
      .map(([k, v]) => `export ${k}="${v}"`)
      .join('\n');
  } else if (format === 'dotenv') {
    output = Object.entries(vars)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');
  } else if (format === 'json') {
    output = JSON.stringify(vars, null, 2);
  }

  return {
    success: true,
    message: output,
    vars
  };
}
