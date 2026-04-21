import * as fs from "fs";
import { decryptVaultFile, getVaultPath } from "../crypto/vault";
import { parseEnvFile, serializeEnvFile } from "../env/parser";
import { encryptEnvFile } from "../crypto/vault";

export interface ShuffleResult {
  vaultPath: string;
  keyCount: number;
  success: boolean;
  error?: string;
}

export function formatShuffleResult(result: ShuffleResult): string {
  if (!result.success) {
    return `✗ Failed to shuffle vault: ${result.error}`;
  }
  return [
    `✓ Shuffled ${result.keyCount} key(s) in ${result.vaultPath}`,
    `  Key order has been randomized and vault re-encrypted.`,
  ].join("\n");
}

export async function runShuffle(
  envFile: string,
  password: string,
  cwd: string = process.cwd()
): Promise<ShuffleResult> {
  const vaultPath = getVaultPath(envFile, cwd);

  if (!fs.existsSync(vaultPath)) {
    return {
      vaultPath,
      keyCount: 0,
      success: false,
      error: `Vault not found: ${vaultPath}`,
    };
  }

  let entries: ReturnType<typeof parseEnvFile>;
  try {
    const decrypted = await decryptVaultFile(vaultPath, password);
    entries = parseEnvFile(decrypted);
  } catch (err: any) {
    return {
      vaultPath,
      keyCount: 0,
      success: false,
      error: err.message ?? String(err),
    };
  }

  // Fisher-Yates shuffle
  for (let i = entries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [entries[i], entries[j]] = [entries[j], entries[i]];
  }

  const shuffled = serializeEnvFile(entries);
  await encryptEnvFile(shuffled, vaultPath, password);

  return {
    vaultPath,
    keyCount: entries.filter((e) => e.type === "entry").length,
    success: true,
  };
}
