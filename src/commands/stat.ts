import * as fs from 'fs';
import * as path from 'path';
import { getVaultPath, isVaultFile } from '../crypto/vault';
import { decryptVaultFile } from '../crypto/vault';

export interface VaultStat {
  vaultPath: string;
  exists: boolean;
  sizeBytes: number;
  keyCount: number;
  createdAt: Date | null;
  modifiedAt: Date | null;
}

export async function getVaultStat(
  dir: string,
  envName: string,
  password: string
): Promise<VaultStat> {
  const vaultPath = getVaultPath(dir, envName);
  if (!fs.existsSync(vaultPath)) {
    return { vaultPath, exists: false, sizeBytes: 0, keyCount: 0, createdAt: null, modifiedAt: null };
  }
  const stats = fs.statSync(vaultPath);
  let keyCount = 0;
  try {
    const entries = await decryptVaultFile(vaultPath, password);
    keyCount = entries.filter(e => e.type === 'pair').length;
  } catch {
    keyCount = -1;
  }
  return {
    vaultPath,
    exists: true,
    sizeBytes: stats.size,
    keyCount,
    createdAt: stats.birthtime,
    modifiedAt: stats.mtime,
  };
}

export function formatStatResult(stat: VaultStat): string {
  if (!stat.exists) return `Vault not found: ${stat.vaultPath}`;
  const lines: string[] = [
    `Vault:     ${stat.vaultPath}`,
    `Size:      ${stat.sizeBytes} bytes`,
    `Keys:      ${stat.keyCount < 0 ? '(decryption failed)' : stat.keyCount}`,
    `Created:   ${stat.createdAt?.toISOString() ?? 'unknown'}`,
    `Modified:  ${stat.modifiedAt?.toISOString() ?? 'unknown'}`,
  ];
  return lines.join('\n');
}
