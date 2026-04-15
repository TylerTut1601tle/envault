import * as fs from 'fs';
import * as path from 'path';
import { getVaultPath, isVaultFile } from '../crypto/vault';
import { listTrackedVaults } from '../git/secrets';

export interface PackResult {
  outputFile: string;
  vaultCount: number;
  vaults: string[];
  error?: string;
}

export async function packVaults(
  dir: string,
  outputFile: string,
  password: string
): Promise<PackResult> {
  const vaults = await listTrackedVaults(dir);

  if (vaults.length === 0) {
    return { outputFile, vaultCount: 0, vaults: [], error: 'No tracked vaults found.' };
  }

  const bundle: Record<string, string> = {};

  for (const vaultName of vaults) {
    const vaultPath = getVaultPath(dir, vaultName);
    if (fs.existsSync(vaultPath) && isVaultFile(vaultPath)) {
      bundle[vaultName] = fs.readFileSync(vaultPath, 'utf8');
    }
  }

  const payload = JSON.stringify({ version: 1, vaults: bundle }, null, 2);
  const outPath = path.isAbsolute(outputFile) ? outputFile : path.join(dir, outputFile);
  fs.writeFileSync(outPath, payload, 'utf8');

  return {
    outputFile: outPath,
    vaultCount: Object.keys(bundle).length,
    vaults: Object.keys(bundle),
  };
}

export function formatPackResult(result: PackResult): string {
  if (result.error) {
    return `❌ Pack failed: ${result.error}`;
  }
  const lines = [
    `📦 Packed ${result.vaultCount} vault(s) → ${result.outputFile}`,
    ...result.vaults.map(v => `   • ${v}`),
  ];
  return lines.join('\n');
}
