import * as fs from 'fs';
import * as path from 'path';
import { getVaultPath, isVaultFile } from '../crypto/vault';
import { encryptEnvFile } from '../crypto/vault';
import { parseEnvFile, serializeEnvFile } from '../env/parser';
import { decryptVaultFile } from '../crypto/vault';

export interface TouchResult {
  vaultPath: string;
  created: boolean;
  keysAdded: string[];
}

export function formatTouchResult(result: TouchResult): string {
  const lines: string[] = [];
  if (result.created) {
    lines.push(`✔ Created new vault: ${result.vaultPath}`);
  } else {
    lines.push(`✔ Updated vault: ${result.vaultPath}`);
  }
  if (result.keysAdded.length > 0) {
    lines.push(`  Added keys: ${result.keysAdded.join(', ')}`);
  } else {
    lines.push(`  No new keys added.`);
  }
  return lines.join('\n');
}

export async function runTouch(
  dir: string,
  envName: string,
  keys: string[],
  password: string
): Promise<TouchResult> {
  const vaultPath = getVaultPath(dir, envName);
  const created = !fs.existsSync(vaultPath);

  let existing: Record<string, string> = {};
  if (!created) {
    const decrypted = await decryptVaultFile(vaultPath, password);
    existing = parseEnvFile(decrypted);
  }

  const keysAdded: string[] = [];
  for (const key of keys) {
    if (!(key in existing)) {
      existing[key] = '';
      keysAdded.push(key);
    }
  }

  const serialized = serializeEnvFile(existing);
  await encryptEnvFile(serialized, vaultPath, password);

  return { vaultPath, created, keysAdded };
}
