import * as fs from 'fs';
import * as path from 'path';
import { decryptVaultFile, isVaultFile } from '../crypto/vault';

export interface UnlockOptions {
  vaultFile: string;
  passphrase: string;
  outputFile?: string;
  overwrite?: boolean;
}

export interface UnlockResult {
  outputPath: string;
  vaultFile: string;
}

export async function unlockVaultFile(options: UnlockOptions): Promise<UnlockResult> {
  const { vaultFile, passphrase, overwrite = false } = options;

  const absoluteVaultPath = path.resolve(vaultFile);

  if (!fs.existsSync(absoluteVaultPath)) {
    throw new Error(`Vault file not found: ${absoluteVaultPath}`);
  }

  if (!isVaultFile(absoluteVaultPath)) {
    throw new Error(`File does not appear to be a vault file: ${absoluteVaultPath}`);
  }

  const outputPath = options.outputFile
    ? path.resolve(options.outputFile)
    : absoluteVaultPath.replace(/\.vault$/, '');

  if (fs.existsSync(outputPath) && !overwrite) {
    throw new Error(`Output file already exists: ${outputPath}. Use --overwrite to replace it.`);
  }

  const decrypted = await decryptVaultFile(absoluteVaultPath, passphrase);
  fs.writeFileSync(outputPath, decrypted, { mode: 0o600 });

  return {
    outputPath,
    vaultFile: absoluteVaultPath,
  };
}
