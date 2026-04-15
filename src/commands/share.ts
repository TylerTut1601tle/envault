import * as fs from 'fs';
import * as path from 'path';
import { decryptVaultFile, getVaultPath } from '../crypto/vault';
import { serializeEnvFile } from '../env/parser';

export interface ShareResult {
  success: boolean;
  vaultName: string;
  outputPath: string;
  keyHint: string;
  error?: string;
}

export function formatShareResult(result: ShareResult): string {
  if (!result.success) {
    return `❌ Share failed: ${result.error}`;
  }
  return [
    `✅ Shared vault "${result.vaultName}" successfully.`,
    `   Output:   ${result.outputPath}`,
    `   Key hint: ${result.keyHint}`,
    `   Share this file along with the password to grant access.`,
  ].join('\n');
}

export async function runShare(
  dir: string,
  vaultName: string,
  password: string,
  outputPath?: string
): Promise<ShareResult> {
  const vaultPath = getVaultPath(dir, vaultName);

  if (!fs.existsSync(vaultPath)) {
    return {
      success: false,
      vaultName,
      outputPath: '',
      keyHint: '',
      error: `Vault "${vaultName}" not found at ${vaultPath}`,
    };
  }

  let entries: Record<string, string>;
  try {
    entries = await decryptVaultFile(vaultPath, password);
  } catch {
    return {
      success: false,
      vaultName,
      outputPath: '',
      keyHint: '',
      error: 'Decryption failed. Check your password.',
    };
  }

  const content = serializeEnvFile(entries);
  const resolvedOutput = outputPath ?? path.join(dir, `${vaultName}.shared.env`);

  fs.writeFileSync(resolvedOutput, content, 'utf-8');

  const keyHint = `${password.slice(0, 2)}${'*'.repeat(Math.max(0, password.length - 4))}${password.slice(-2)}`;

  return {
    success: true,
    vaultName,
    outputPath: resolvedOutput,
    keyHint,
  };
}
