import { readFileSync, writeFileSync, existsSync } from 'fs';
import { encrypt, decrypt } from './encryption';

export const VAULT_EXTENSION = '.vault';

export interface VaultOptions {
  passphrase: string;
}

export function encryptEnvFile(
  envFilePath: string,
  vaultFilePath: string,
  options: VaultOptions
): void {
  if (!existsSync(envFilePath)) {
    throw new Error(`Env file not found: ${envFilePath}`);
  }

  const plaintext = readFileSync(envFilePath, 'utf8');
  const ciphertext = encrypt(plaintext, options.passphrase);

  writeFileSync(vaultFilePath, ciphertext, 'utf8');
}

export function decryptVaultFile(
  vaultFilePath: string,
  envFilePath: string,
  options: VaultOptions
): void {
  if (!existsSync(vaultFilePath)) {
    throw new Error(`Vault file not found: ${vaultFilePath}`);
  }

  const ciphertext = readFileSync(vaultFilePath, 'utf8').trim();
  const plaintext = decrypt(ciphertext, options.passphrase);

  writeFileSync(envFilePath, plaintext, 'utf8');
}

export function getVaultPath(envFilePath: string): string {
  return `${envFilePath}${VAULT_EXTENSION}`;
}

export function isVaultFile(filePath: string): boolean {
  return filePath.endsWith(VAULT_EXTENSION);
}
