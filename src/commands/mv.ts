import * as fs from 'fs';
import * as path from 'path';
import { getVaultPath, isVaultFile } from '../crypto/vault';

export interface MvResult {
  success: boolean;
  from: string;
  to: string;
  error?: string;
}

export function formatMvResult(result: MvResult): string {
  if (!result.success) {
    return `Error: ${result.error}`;
  }
  return `Moved vault: ${result.from} → ${result.to}`;
}

export async function runMv(
  dir: string,
  fromName: string,
  toName: string
): Promise<MvResult> {
  const fromPath = getVaultPath(dir, fromName);
  const toPath = getVaultPath(dir, toName);

  if (!fs.existsSync(fromPath)) {
    return { success: false, from: fromName, to: toName, error: `Vault '${fromName}' not found` };
  }

  if (!isVaultFile(fromPath)) {
    return { success: false, from: fromName, to: toName, error: `'${fromName}' is not a valid vault file` };
  }

  if (fs.existsSync(toPath)) {
    return { success: false, from: fromName, to: toName, error: `Vault '${toName}' already exists` };
  }

  const toDir = path.dirname(toPath);
  if (!fs.existsSync(toDir)) {
    fs.mkdirSync(toDir, { recursive: true });
  }

  fs.renameSync(fromPath, toPath);

  return { success: true, from: fromName, to: toName };
}
