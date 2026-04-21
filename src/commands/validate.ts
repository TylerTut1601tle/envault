import * as fs from 'fs';
import { decryptVaultFile, getVaultPath, isVaultFile } from '../crypto/vault';
import { parseEnvFile } from '../env/parser';

export interface ValidateResult {
  vault: string;
  valid: boolean;
  keyCount: number;
  missingKeys: string[];
  extraKeys: string[];
  errors: string[];
}

export async function validateVault(
  vaultPath: string,
  password: string,
  schemaPath?: string
): Promise<ValidateResult> {
  const errors: string[] = [];
  let keyCount = 0;
  let missingKeys: string[] = [];
  let extraKeys: string[] = [];

  if (!fs.existsSync(vaultPath)) {
    return { vault: vaultPath, valid: false, keyCount: 0, missingKeys: [], extraKeys: [], errors: [`Vault not found: ${vaultPath}`] };
  }

  if (!isVaultFile(vaultPath)) {
    errors.push(`Not a valid vault file: ${vaultPath}`);
    return { vault: vaultPath, valid: false, keyCount: 0, missingKeys: [], extraKeys: [], errors };
  }

  let entries: Record<string, string>;
  try {
    const decrypted = await decryptVaultFile(vaultPath, password);
    entries = Object.fromEntries(parseEnvFile(decrypted).map(e => [e.key, e.value ?? '']));
    keyCount = Object.keys(entries).length;
  } catch (e: any) {
    return { vault: vaultPath, valid: false, keyCount: 0, missingKeys: [], extraKeys: [], errors: [`Decryption failed: ${e.message}`] };
  }

  if (schemaPath) {
    if (!fs.existsSync(schemaPath)) {
      errors.push(`Schema file not found: ${schemaPath}`);
    } else {
      const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
      const schemaEntries = parseEnvFile(schemaContent);
      const requiredKeys = schemaEntries.map(e => e.key);
      missingKeys = requiredKeys.filter(k => !(k in entries));
      extraKeys = Object.keys(entries).filter(k => !requiredKeys.includes(k));
      if (missingKeys.length > 0) {
        errors.push(`Missing required keys: ${missingKeys.join(', ')}`);
      }
    }
  }

  return {
    vault: vaultPath,
    valid: errors.length === 0,
    keyCount,
    missingKeys,
    extraKeys,
    errors,
  };
}

export function formatValidateResult(result: ValidateResult): string {
  const lines: string[] = [];
  const status = result.valid ? '✔ valid' : '✘ invalid';
  lines.push(`${status}  ${result.vault}  (${result.keyCount} keys)`);
  if (result.missingKeys.length > 0) {
    lines.push(`  Missing keys: ${result.missingKeys.join(', ')}`);
  }
  if (result.extraKeys.length > 0) {
    lines.push(`  Extra keys:   ${result.extraKeys.join(', ')}`);
  }
  for (const err of result.errors) {
    lines.push(`  Error: ${err}`);
  }
  return lines.join('\n');
}
