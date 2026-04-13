import * as fs from 'fs';
import * as path from 'path';
import { encryptEnvFile, getVaultPath } from '../crypto/vault';
import { parseEnvFile } from '../env/parser';

export interface ImportResult {
  success: boolean;
  vaultPath: string;
  keyCount: number;
  error?: string;
}

export function formatImportResult(result: ImportResult): string {
  if (!result.success) {
    return `✗ Import failed: ${result.error}`;
  }
  return [
    `✓ Imported ${result.keyCount} key(s) into vault`,
    `  Vault: ${result.vaultPath}`,
  ].join('\n');
}

export async function runImport(
  envFilePath: string,
  name: string,
  password: string,
  repoRoot: string
): Promise<ImportResult> {
  const resolvedEnvPath = path.resolve(repoRoot, envFilePath);

  if (!fs.existsSync(resolvedEnvPath)) {
    return {
      success: false,
      vaultPath: '',
      keyCount: 0,
      error: `File not found: ${resolvedEnvPath}`,
    };
  }

  let rawContent: string;
  try {
    rawContent = fs.readFileSync(resolvedEnvPath, 'utf-8');
  } catch (err: any) {
    return {
      success: false,
      vaultPath: '',
      keyCount: 0,
      error: `Could not read file: ${err.message}`,
    };
  }

  const entries = parseEnvFile(rawContent);
  const keyCount = entries.filter(e => e.type === 'entry').length;

  const vaultPath = getVaultPath(repoRoot, name);

  try {
    const vaultDir = path.dirname(vaultPath);
    if (!fs.existsSync(vaultDir)) {
      fs.mkdirSync(vaultDir, { recursive: true });
    }
    await encryptEnvFile(rawContent, password, vaultPath);
  } catch (err: any) {
    return {
      success: false,
      vaultPath,
      keyCount: 0,
      error: `Encryption failed: ${err.message}`,
    };
  }

  return {
    success: true,
    vaultPath: path.relative(repoRoot, vaultPath),
    keyCount,
  };
}
