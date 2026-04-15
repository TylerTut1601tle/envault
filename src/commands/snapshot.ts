import * as fs from 'fs';
import * as path from 'path';
import { decryptVaultFile, getVaultPath } from '../crypto/vault';

export interface SnapshotEntry {
  timestamp: string;
  label?: string;
  content: string;
}

export function getSnapshotDir(repoRoot: string): string {
  return path.join(repoRoot, '.envault', 'snapshots');
}

export function getSnapshotPath(repoRoot: string, vaultName: string): string {
  return path.join(getSnapshotDir(repoRoot), `${vaultName}.snapshots.json`);
}

export function readSnapshots(repoRoot: string, vaultName: string): SnapshotEntry[] {
  const snapshotPath = getSnapshotPath(repoRoot, vaultName);
  if (!fs.existsSync(snapshotPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(snapshotPath, 'utf-8'));
  } catch {
    return [];
  }
}

export function writeSnapshots(repoRoot: string, vaultName: string, entries: SnapshotEntry[]): void {
  const dir = getSnapshotDir(repoRoot);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(getSnapshotPath(repoRoot, vaultName), JSON.stringify(entries, null, 2));
}

export function takeSnapshot(
  repoRoot: string,
  vaultName: string,
  password: string,
  label?: string
): SnapshotEntry {
  const vaultPath = getVaultPath(repoRoot, vaultName);
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault not found: ${vaultName}`);
  }
  const content = decryptVaultFile(vaultPath, password);
  const entry: SnapshotEntry = {
    timestamp: new Date().toISOString(),
    label,
    content,
  };
  const existing = readSnapshots(repoRoot, vaultName);
  writeSnapshots(repoRoot, vaultName, [...existing, entry]);
  return entry;
}

export function formatSnapshotResult(
  action: 'taken' | 'listed' | 'restored',
  vaultName: string,
  detail?: string
): string {
  if (action === 'taken') {
    return `📸 Snapshot taken for vault "${vaultName}"${detail ? ` (${detail})` : ''}`;
  }
  if (action === 'restored') {
    return `♻️  Vault "${vaultName}" restored from snapshot${detail ? ` at ${detail}` : ''}`;
  }
  return detail ?? `No snapshots found for "${vaultName}"`;
}
