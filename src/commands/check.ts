import * as fs from 'fs';
import * as path from 'path';
import { decryptVaultFile, getVaultPath, isVaultFile } from '../crypto/vault';
import { parseEnvFile } from '../env/parser';

export interface CheckResult {
  vault: string;
  valid: boolean;
  keyCount: number;
  missingKeys: string[];
  extraKeys: string[];
  error?: string;
}

export function formatCheckResult(result: CheckResult): string {
  if (result.error) {
    return `✗ ${result.vault}: ${result.error}`;
  }
  const lines: string[] = [];
  lines.push(`${result.valid ? '✓' : '✗'} ${result.vault} (${result.keyCount} keys)`);
  if (result.missingKeys.length > 0) {
    lines.push(`  Missing keys: ${result.missingKeys.join(', ')}`);
  }
  if (result.extraKeys.length > 0) {
    lines.push(`  Extra keys:   ${result.extraKeys.join(', ')}`);
  }
  if (result.valid) {
    lines.push('  All keys present.');
  }
  return lines.join('\n');
}

export async function runCheck(
  vaultPath: string,
  password: string,
  referenceFile?: string
): Promise<CheckResult> {
  const vaultName = path.basename(vaultPath);

  if (!fs.existsSync(vaultPath)) {
    return { vault: vaultName, valid: false, keyCount: 0, missingKeys: [], extraKeys: [], error: 'Vault file not found' };
  }

  if (!isVaultFile(vaultPath)) {
    return { vault: vaultName, valid: false, keyCount: 0, missingKeys: [], extraKeys: [], error: 'Not a valid vault file' };
  }

  let entries: Record<string, string>;
  try {
    const decrypted = await decryptVaultFile(vaultPath, password);
    entries = Object.fromEntries(parseEnvFile(decrypted).map(e => [e.key, e.value ?? '']));
  } catch (err: any) {
    return { vault: vaultName, valid: false, keyCount: 0, missingKeys: [], extraKeys: [], error: err.message ?? 'Decryption failed' };
  }

  const vaultKeys = Object.keys(entries);

  if (!referenceFile) {
    return { vault: vaultName, valid: true, keyCount: vaultKeys.length, missingKeys: [], extraKeys: [] };
  }

  if (!fs.existsSync(referenceFile)) {
    return { vault: vaultName, valid: false, keyCount: vaultKeys.length, missingKeys: [], extraKeys: [], error: `Reference file not found: ${referenceFile}` };
  }

  const refContent = fs.readFileSync(referenceFile, 'utf-8');
  const refKeys = parseEnvFile(refContent).map(e => e.key);

  const missingKeys = refKeys.filter(k => !vaultKeys.includes(k));
  const extraKeys = vaultKeys.filter(k => !refKeys.includes(k));
  const valid = missingKeys.length === 0;

  return { vault: vaultName, valid, keyCount: vaultKeys.length, missingKeys, extraKeys };
}
