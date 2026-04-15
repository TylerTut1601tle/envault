import * as fs from "fs";
import * as path from "path";
import { decryptVaultFile, encryptEnvFile, getVaultPath, isVaultFile } from "../crypto/vault";
import { listTrackedVaults } from "../git/secrets";

export interface RekeyResult {
  rekeyed: string[];
  failed: { vault: string; error: string }[];
  skipped: string[];
}

export async function rekeyVaults(
  dir: string,
  oldPassword: string,
  newPassword: string,
  vaults?: string[]
): Promise<RekeyResult> {
  const result: RekeyResult = { rekeyed: [], failed: [], skipped: [] };

  const targets = vaults && vaults.length > 0
    ? vaults.map((v) => (isVaultFile(v) ? v : getVaultPath(dir, v)))
    : await listTrackedVaults(dir);

  for (const vaultPath of targets) {
    if (!fs.existsSync(vaultPath)) {
      result.skipped.push(vaultPath);
      continue;
    }
    try {
      const decrypted = await decryptVaultFile(vaultPath, oldPassword);
      const envPath = vaultPath.replace(/\.vault$/, ".env");
      const tmpPath = envPath + ".rekey.tmp";
      fs.writeFileSync(tmpPath, decrypted, "utf8");
      const newVaultPath = await encryptEnvFile(tmpPath, newPassword, dir);
      fs.unlinkSync(tmpPath);
      if (newVaultPath !== vaultPath) {
        fs.renameSync(newVaultPath, vaultPath);
      }
      result.rekeyed.push(vaultPath);
    } catch (err: any) {
      result.failed.push({ vault: vaultPath, error: err.message });
    }
  }

  return result;
}

export function formatRekeyResult(result: RekeyResult): string {
  const lines: string[] = [];
  if (result.rekeyed.length > 0) {
    lines.push(`✅ Rekeyed (${result.rekeyed.length}):`);
    result.rekeyed.forEach((v) => lines.push(`   ${path.basename(v)}`));
  }
  if (result.skipped.length > 0) {
    lines.push(`⚠️  Skipped (${result.skipped.length}):`);
    result.skipped.forEach((v) => lines.push(`   ${path.basename(v)} (not found)`));
  }
  if (result.failed.length > 0) {
    lines.push(`❌ Failed (${result.failed.length}):`);
    result.failed.forEach((f) => lines.push(`   ${path.basename(f.vault)}: ${f.error}`));
  }
  if (lines.length === 0) {
    lines.push("No vaults found to rekey.");
  }
  return lines.join("\n");
}
