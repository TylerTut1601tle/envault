import * as fs from "fs";
import * as path from "path";
import { getDefaultConfig } from "../git/secrets";
import { isVaultFile, getVaultPath } from "../crypto/vault";

export interface AuditEntry {
  vault: string;
  lastModified: Date;
  sizeBytes: number;
  hasCorrespondingEnv: boolean;
}

export interface AuditResult {
  entries: AuditEntry[];
  totalVaults: number;
  orphanedVaults: number;
}

export async function runAudit(cwd: string): Promise<AuditResult> {
  const config = getDefaultConfig(cwd);
  const vaultDir = config.vaultDir;

  if (!fs.existsSync(vaultDir)) {
    return { entries: [], totalVaults: 0, orphanedVaults: 0 };
  }

  const files = fs.readdirSync(vaultDir);
  const entries: AuditEntry[] = [];

  for (const file of files) {
    const fullPath = path.join(vaultDir, file);
    if (!isVaultFile(fullPath)) continue;

    const stat = fs.statSync(fullPath);
    const envName = file.replace(/\.vault$/, "");
    const envPath = path.join(cwd, `.env.${envName}`);
    const hasEnv = fs.existsSync(envPath);

    entries.push({
      vault: envName,
      lastModified: stat.mtime,
      sizeBytes: stat.size,
      hasCorrespondingEnv: hasEnv,
    });
  }

  const orphanedVaults = entries.filter((e) => !e.hasCorrespondingEnv).length;

  return {
    entries,
    totalVaults: entries.length,
    orphanedVaults,
  };
}

export function formatAuditResult(result: AuditResult): string {
  if (result.totalVaults === 0) {
    return "No vaults found.";
  }

  const lines: string[] = [`Found ${result.totalVaults} vault(s):\n`];

  for (const entry of result.entries) {
    const status = entry.hasCorrespondingEnv ? "✓" : "⚠ orphaned";
    const date = entry.lastModified.toISOString().split("T")[0];
    lines.push(`  [${status}] ${entry.vault}  (${entry.sizeBytes}B, modified ${date})`);
  }

  if (result.orphanedVaults > 0) {
    lines.push(`\n⚠  ${result.orphanedVaults} orphaned vault(s) have no matching .env file.`);
  }

  return lines.join("\n");
}
