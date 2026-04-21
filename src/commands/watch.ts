import * as fs from 'fs';
import * as path from 'path';
import { decryptVaultFile, getVaultPath, isVaultFile } from '../crypto/vault';
import { parseEnvFile } from '../env/parser';

export interface WatchResult {
  vaultPath: string;
  event: 'changed' | 'error';
  keyCount?: number;
  error?: string;
}

export function formatWatchResult(result: WatchResult): string {
  if (result.event === 'error') {
    return `[watch] Error on ${result.vaultPath}: ${result.error}`;
  }
  return `[watch] ${result.vaultPath} changed — ${result.keyCount} key(s) loaded`;
}

export async function runWatch(
  envFile: string,
  password: string,
  cwd: string,
  onChange: (result: WatchResult) => void
): Promise<() => void> {
  const vaultPath = isVaultFile(envFile)
    ? path.resolve(cwd, envFile)
    : path.resolve(cwd, getVaultPath(envFile));

  const handleChange = async () => {
    try {
      const content = await decryptVaultFile(vaultPath, password);
      const entries = parseEnvFile(content);
      const keyCount = entries.filter(e => e.type === 'entry').length;
      onChange({ vaultPath, event: 'changed', keyCount });
    } catch (err: any) {
      onChange({ vaultPath, event: 'error', error: err.message });
    }
  };

  // Trigger once immediately
  await handleChange();

  const watcher = fs.watch(vaultPath, async (eventType) => {
    if (eventType === 'change') {
      await handleChange();
    }
  });

  return () => watcher.close();
}
