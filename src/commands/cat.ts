import * as fs from 'fs';
import * as path from 'path';
import { decryptVaultFile, getVaultPath } from '../crypto/vault';
import { serializeEnvFile } from '../env/parser';

export interface CatOptions {
  env?: string;
  password: string;
  cwd?: string;
}

export interface CatResult {
  success: boolean;
  content?: string;
  error?: string;
  vaultPath?: string;
}

export async function runCat(options: CatOptions): Promise<CatResult> {
  const cwd = options.cwd ?? process.cwd();
  const envName = options.env ?? '.env';
  const vaultPath = getVaultPath(cwd, envName);

  if (!fs.existsSync(vaultPath)) {
    return { success: false, error: `Vault not found: ${path.relative(cwd, vaultPath)}` };
  }

  try {
    const encrypted = fs.readFileSync(vaultPath, 'utf-8');
    const entries = await decryptVaultFile(encrypted, options.password);
    const content = serializeEnvFile(entries);
    return { success: true, content, vaultPath };
  } catch {
    return { success: false, error: 'Failed to decrypt vault. Wrong password?' };
  }
}

export function formatCatResult(result: CatResult): string {
  if (!result.success) return `Error: ${result.error}`;
  return result.content ?? '';
}
