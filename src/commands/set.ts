import * as fs from "fs";
import * as path from "path";
import { decryptVaultFile, encryptEnvFile, getVaultPath, isVaultFile } from "../crypto/vault";
import { parseEnvFile, serializeEnvFile } from "../env/parser";

export interface SetResult {
  vaultPath: string;
  key: string;
  created: boolean;
  updated: boolean;
}

export function formatSetResult(result: SetResult): string {
  const action = result.created ? "created" : "updated";
  return `✔ Key "${result.key}" ${action} in ${result.vaultPath}`;
}

export async function runSet(
  dir: string,
  envFile: string,
  key: string,
  value: string,
  password: string
): Promise<SetResult> {
  const vaultPath = getVaultPath(dir, envFile);

  let entries: Record<string, string> = {};
  let created = false;

  if (fs.existsSync(vaultPath)) {
    if (!isVaultFile(vaultPath)) {
      throw new Error(`File is not a valid vault: ${vaultPath}`);
    }
    const decrypted = await decryptVaultFile(vaultPath, password);
    entries = parseEnvFile(decrypted);
  } else {
    // Ensure the directory exists
    const vaultDir = path.dirname(vaultPath);
    if (!fs.existsSync(vaultDir)) {
      fs.mkdirSync(vaultDir, { recursive: true });
    }
  }

  const existed = key in entries;
  entries[key] = value;

  if (!existed) {
    created = true;
  }

  const serialized = serializeEnvFile(entries);
  await encryptEnvFile(vaultPath, serialized, password);

  return {
    vaultPath,
    key,
    created,
    updated: !created,
  };
}
