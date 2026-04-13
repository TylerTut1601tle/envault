import * as fs from "fs";
import * as path from "path";
import { getVaultPath, isVaultFile, decryptVaultFile, encryptEnvFile } from "../crypto/vault";
import { parseEnvFile, serializeEnvFile } from "../env/parser";

export interface CopyResult {
  source: string;
  destination: string;
  keyCount: number;
  overwrote: boolean;
}

export function formatCopyResult(result: CopyResult): string {
  const lines: string[] = [];
  lines.push(`✔ Copied vault: ${result.source} → ${result.destination}`);
  lines.push(`  Keys copied : ${result.keyCount}`);
  if (result.overwrote) {
    lines.push(`  ⚠ Destination vault was overwritten.`);
  }
  return lines.join("\n");
}

export async function runCopy(
  sourceEnv: string,
  destEnv: string,
  password: string,
  cwd: string = process.cwd()
): Promise<CopyResult> {
  const sourceVault = getVaultPath(sourceEnv, cwd);
  const destVault = getVaultPath(destEnv, cwd);

  if (!fs.existsSync(sourceVault)) {
    throw new Error(`Source vault not found: ${sourceVault}`);
  }

  if (!isVaultFile(sourceVault)) {
    throw new Error(`Source is not a valid vault file: ${sourceVault}`);
  }

  const overwrote = fs.existsSync(destVault);

  const decrypted = await decryptVaultFile(sourceVault, password);
  const entries = parseEnvFile(decrypted);
  const serialized = serializeEnvFile(entries);

  await encryptEnvFile(serialized, destVault, password);

  return {
    source: path.basename(sourceEnv),
    destination: path.basename(destEnv),
    keyCount: entries.filter((e) => e.type === "entry").length,
    overwrote,
  };
}
