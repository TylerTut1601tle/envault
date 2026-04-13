import * as fs from "fs";
import * as path from "path";
import { decryptVaultFile, getVaultPath, isVaultFile } from "../crypto/vault";
import { parseEnvFile } from "../env/parser";

export interface DiffResult {
  added: string[];
  removed: string[];
  changed: string[];
  unchanged: string[];
}

export function diffEnvFiles(
  original: Record<string, string>,
  updated: Record<string, string>
): DiffResult {
  const allKeys = new Set([...Object.keys(original), ...Object.keys(updated)]);
  const result: DiffResult = { added: [], removed: [], changed: [], unchanged: [] };

  for (const key of allKeys) {
    const inOriginal = key in original;
    const inUpdated = key in updated;
    if (!inOriginal) {
      result.added.push(key);
    } else if (!inUpdated) {
      result.removed.push(key);
    } else if (original[key] !== updated[key]) {
      result.changed.push(key);
    } else {
      result.unchanged.push(key);
    }
  }

  return result;
}

export function formatDiff(diff: DiffResult, maskValues = true): string {
  const lines: string[] = [];

  if (diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0) {
    return "No differences found.";
  }

  for (const key of diff.added) {
    lines.push(`+ ${key}${maskValues ? "" : ""}`);
  }
  for (const key of diff.removed) {
    lines.push(`- ${key}`);
  }
  for (const key of diff.changed) {
    lines.push(`~ ${key}`);
  }

  return lines.join("\n");
}

export async function runDiff(
  envFilePath: string,
  password: string
): Promise<{ diff: DiffResult; output: string }> {
  const vaultPath = getVaultPath(envFilePath);

  if (!fs.existsSync(envFilePath)) {
    throw new Error(`Env file not found: ${envFilePath}`);
  }
  if (!fs.existsSync(vaultPath)) {
    throw new Error(`Vault file not found: ${vaultPath}. Run 'envault lock' first.`);
  }

  const currentContent = fs.readFileSync(envFilePath, "utf-8");
  const currentEnv = parseEnvFile(currentContent);

  const decryptedContent = await decryptVaultFile(vaultPath, password);
  const vaultEnv = parseEnvFile(decryptedContent);

  const diff = diffEnvFiles(vaultEnv, currentEnv);
  const output = formatDiff(diff);

  return { diff, output };
}
