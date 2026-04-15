import * as fs from "fs";
import { decryptVaultFile, encryptEnvFile, getVaultPath } from "../crypto/vault";
import { parseEnvFile, serializeEnvFile } from "../env/parser";

export interface UnsetResult {
  vaultFile: string;
  removedKeys: string[];
  notFoundKeys: string[];
  totalRemaining: number;
}

export function formatUnsetResult(result: UnsetResult): string {
  const lines: string[] = [];

  if (result.removedKeys.length > 0) {
    lines.push(`✔ Removed ${result.removedKeys.length} key(s) from ${result.vaultFile}:`);
    for (const key of result.removedKeys) {
      lines.push(`  - ${key}`);
    }
  }

  if (result.notFoundKeys.length > 0) {
    lines.push(`⚠ Key(s) not found in ${result.vaultFile}:`);
    for (const key of result.notFoundKeys) {
      lines.push(`  ? ${key}`);
    }
  }

  lines.push(`  ${result.totalRemaining} key(s) remaining.`);
  return lines.join("\n");
}

export async function runUnset(
  dir: string,
  envName: string,
  keys: string[],
  password: string
): Promise<UnsetResult> {
  const vaultPath = getVaultPath(dir, envName);

  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault not found: ${vaultPath}`);
  }

  if (keys.length === 0) {
    throw new Error("No keys specified to unset.");
  }

  const decrypted = await decryptVaultFile(vaultPath, password);
  const entries = parseEnvFile(decrypted);
  const envMap = new Map(entries.map((e) => [e.key, e]));

  const removedKeys: string[] = [];
  const notFoundKeys: string[] = [];

  for (const key of keys) {
    if (envMap.has(key)) {
      envMap.delete(key);
      removedKeys.push(key);
    } else {
      notFoundKeys.push(key);
    }
  }

  const updatedEntries = Array.from(envMap.values());
  const serialized = serializeEnvFile(updatedEntries);
  await encryptEnvFile(vaultPath, serialized, password);

  return {
    vaultFile: vaultPath,
    removedKeys,
    notFoundKeys,
    totalRemaining: updatedEntries.length,
  };
}
