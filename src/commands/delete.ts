import fs from "fs";
import path from "path";
import { getVaultPath, isVaultFile } from "../crypto/vault";
import { getRepoRoot } from "../git/secrets";
import { unregisterVault } from "./push-register";

export interface DeleteResult {
  success: boolean;
  vaultPath: string;
  envFile: string;
  message: string;
}

export function formatDeleteResult(result: DeleteResult): string {
  if (!result.success) {
    return `✗ ${result.message}`;
  }
  return [
    `✓ Deleted vault: ${result.vaultPath}`,
    `  Env file:      ${result.envFile}`,
  ].join("\n");
}

export async function runDelete(
  envFile: string,
  options: { cwd?: string; force?: boolean } = {}
): Promise<DeleteResult> {
  const cwd = options.cwd ?? process.cwd();
  const repoRoot = await getRepoRoot(cwd);
  const resolvedEnv = path.resolve(cwd, envFile);
  const vaultPath = getVaultPath(resolvedEnv);

  if (!fs.existsSync(vaultPath)) {
    return {
      success: false,
      vaultPath,
      envFile: resolvedEnv,
      message: `Vault file not found: ${vaultPath}`,
    };
  }

  if (!isVaultFile(vaultPath)) {
    return {
      success: false,
      vaultPath,
      envFile: resolvedEnv,
      message: `File does not appear to be a valid vault: ${vaultPath}`,
    };
  }

  fs.unlinkSync(vaultPath);

  try {
    await unregisterVault(vaultPath, repoRoot ?? cwd);
  } catch {
    // Registry update is best-effort
  }

  return {
    success: true,
    vaultPath,
    envFile: resolvedEnv,
    message: `Vault deleted successfully`,
  };
}
