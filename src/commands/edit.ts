import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { decryptVaultFile, encryptEnvFile, getVaultPath, isVaultFile } from "../crypto/vault";
import os from "os";

export interface EditResult {
  success: boolean;
  message: string;
  envFile: string;
  vaultFile: string;
  changed: boolean;
}

export async function runEdit(
  envFilePath: string,
  passphrase: string
): Promise<EditResult> {
  const absEnvPath = path.resolve(envFilePath);
  const vaultPath = getVaultPath(absEnvPath);

  if (!fs.existsSync(vaultPath)) {
    return {
      success: false,
      message: `No vault found for ${envFilePath}. Run 'envault lock' first.`,
      envFile: envFilePath,
      vaultFile: vaultPath,
      changed: false,
    };
  }

  const originalContent = await decryptVaultFile(vaultPath, passphrase);

  const tmpFile = path.join(os.tmpdir(), `.envault-edit-${Date.now()}.env`);
  fs.writeFileSync(tmpFile, originalContent, "utf-8");

  const editor = process.env.EDITOR || process.env.VISUAL || "vi";
  const result = spawnSync(editor, [tmpFile], { stdio: "inherit" });

  if (result.error) {
    fs.unlinkSync(tmpFile);
    return {
      success: false,
      message: `Failed to open editor: ${result.error.message}`,
      envFile: envFilePath,
      vaultFile: vaultPath,
      changed: false,
    };
  }

  const editedContent = fs.readFileSync(tmpFile, "utf-8");
  fs.unlinkSync(tmpFile);

  const changed = editedContent !== originalContent;

  if (!changed) {
    return {
      success: true,
      message: "No changes made.",
      envFile: envFilePath,
      vaultFile: vaultPath,
      changed: false,
    };
  }

  fs.writeFileSync(absEnvPath, editedContent, "utf-8");
  await encryptEnvFile(absEnvPath, passphrase);
  fs.unlinkSync(absEnvPath);

  return {
    success: true,
    message: `Vault updated for ${envFilePath}.`,
    envFile: envFilePath,
    vaultFile: vaultPath,
    changed: true,
  };
}

export function formatEditResult(result: EditResult): string {
  if (!result.success) return `✖ ${result.message}`;
  if (!result.changed) return `○ ${result.message}`;
  return `✔ ${result.message}`;
}
