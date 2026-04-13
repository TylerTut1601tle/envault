import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { decryptVaultFile, getVaultPath } from "../crypto/vault";
import { parseEnvFile } from "../env/parser";

export interface RunResult {
  exitCode: number;
  error?: string;
}

export async function runWithEnv(
  vaultFile: string,
  password: string,
  command: string[],
  cwd?: string
): Promise<RunResult> {
  if (!fs.existsSync(vaultFile)) {
    return { exitCode: 1, error: `Vault file not found: ${vaultFile}` };
  }

  let decrypted: string;
  try {
    decrypted = await decryptVaultFile(vaultFile, password);
  } catch {
    return { exitCode: 1, error: "Failed to decrypt vault: invalid password or corrupted file" };
  }

  const entries = parseEnvFile(decrypted);
  const envVars: Record<string, string> = {};
  for (const entry of entries) {
    if (entry.key) {
      envVars[entry.key] = entry.value ?? "";
    }
  }

  const mergedEnv = { ...process.env, ...envVars };

  try {
    execSync(command.join(" "), {
      env: mergedEnv,
      cwd: cwd ?? process.cwd(),
      stdio: "inherit",
    });
    return { exitCode: 0 };
  } catch (err: any) {
    return { exitCode: err.status ?? 1, error: err.message };
  }
}

export function formatRunResult(result: RunResult): string {
  if (result.error) {
    return `Error: ${result.error}`;
  }
  return `Command exited with code ${result.exitCode}`;
}
