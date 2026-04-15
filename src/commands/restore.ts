import * as fs from 'fs';
import * as path from 'path';
import { getSnapshotDir, readSnapshots } from './snapshot';
import { decryptVaultFile } from '../crypto/vault';
import { serializeEnvFile } from '../env/parser';

export interface RestoreResult {
  success: boolean;
  snapshotId: string;
  targetFile: string;
  restoredKeys: number;
  message: string;
}

export async function runRestore(
  vaultPath: string,
  snapshotId: string,
  password: string,
  outputPath?: string
): Promise<RestoreResult> {
  const snapshotDir = getSnapshotDir(vaultPath);
  const snapshots = readSnapshots(snapshotDir);

  const snapshot = snapshots.find((s) => s.id === snapshotId || s.id.startsWith(snapshotId));
  if (!snapshot) {
    return {
      success: false,
      snapshotId,
      targetFile: '',
      restoredKeys: 0,
      message: `Snapshot '${snapshotId}' not found.`,
    };
  }

  const snapshotVaultPath = path.join(snapshotDir, `${snapshot.id}.vault`);
  if (!fs.existsSync(snapshotVaultPath)) {
    return {
      success: false,
      snapshotId: snapshot.id,
      targetFile: '',
      restoredKeys: 0,
      message: `Snapshot vault file not found: ${snapshotVaultPath}`,
    };
  }

  const envMap = await decryptVaultFile(snapshotVaultPath, password);
  const content = serializeEnvFile(envMap);
  const target = outputPath ?? vaultPath.replace(/\.vault$/, '.env');

  fs.writeFileSync(target, content, 'utf-8');

  return {
    success: true,
    snapshotId: snapshot.id,
    targetFile: target,
    restoredKeys: Object.keys(envMap).length,
    message: `Restored ${Object.keys(envMap).length} keys from snapshot '${snapshot.id}' to '${target}'.`,
  };
}

export function formatRestoreResult(result: RestoreResult): string {
  if (!result.success) {
    return `✖ Restore failed: ${result.message}`;
  }
  return [
    `✔ Restored snapshot: ${result.snapshotId}`,
    `  Target: ${result.targetFile}`,
    `  Keys restored: ${result.restoredKeys}`,
  ].join('\n');
}
