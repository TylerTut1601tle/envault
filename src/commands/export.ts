import * as fs from "fs";
import * as path from "path";
import { decryptVaultFile, getVaultPath, isVaultFile } from "../crypto/vault";

export interface ExportResult {
  success: boolean;
  outputPath: string;
  keyCount: number;
  error?: string;
}

export function formatExportResult(result: ExportResult): string {
  if (!result.success) {
    return `❌ Export failed: ${result.error}`;
  }
  return [
    `✅ Exported ${result.keyCount} key(s) to ${result.outputPath}`,
  ].join("\n");
}

export async function runExport(
  envName: string,
  password: string,
  outputPath?: string,
  cwd: string = process.cwd()
): Promise<ExportResult> {
  const vaultPath = getVaultPath(envName, cwd);

  if (!fs.existsSync(vaultPath)) {
    return {
      success: false,
      outputPath: "",
      keyCount: 0,
      error: `Vault for "${envName}" not found at ${vaultPath}`,
    };
  }

  if (!isVaultFile(vaultPath)) {
    return {
      success: false,
      outputPath: "",
      keyCount: 0,
      error: `File at ${vaultPath} is not a valid vault`,
    };
  }

  let entries: Record<string, string>;
  try {
    entries = await decryptVaultFile(vaultPath, password);
  } catch {
    return {
      success: false,
      outputPath: "",
      keyCount: 0,
      error: "Decryption failed. Wrong password?",
    };
  }

  const resolvedOutput = outputPath
    ? path.resolve(cwd, outputPath)
    : path.join(cwd, envName === "default" ? ".env" : `.env.${envName}`);

  const lines = Object.entries(entries)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  fs.writeFileSync(resolvedOutput, lines + "\n", "utf-8");

  return {
    success: true,
    outputPath: resolvedOutput,
    keyCount: Object.keys(entries).length,
  };
}
