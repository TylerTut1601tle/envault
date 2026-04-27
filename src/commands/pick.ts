import * as fs from "fs";
import { decryptVaultFile, getVaultPath } from "../crypto/vault";
import { parseEnvFile, serializeEnvFile } from "../env/parser";

export interface PickOptions {
  keys: string[];
  output?: string;
  invert?: boolean; // pick all EXCEPT the specified keys
}

export interface PickResult {
  picked: string[];
  missing: string[];
  outputPath: string;
  invert: boolean;
}

/**
 * Pick (or exclude) specific keys from a vault file and write the result
 * to a plain .env file (or another path).
 *
 * When `invert` is true the behaviour mirrors a "reject" / "omit" — every
 * key that is NOT in `keys` is kept.
 */
export async function runPick(
  vaultPath: string,
  password: string,
  options: PickOptions
): Promise<PickResult> {
  const resolvedVault = getVaultPath(vaultPath);

  if (!fs.existsSync(resolvedVault)) {
    throw new Error(`Vault file not found: ${resolvedVault}`);
  }

  const decrypted = await decryptVaultFile(resolvedVault, password);
  const envMap = parseEnvFile(decrypted);

  const allKeys = Object.keys(envMap);
  const requestedKeys = options.keys.map((k) => k.trim().toUpperCase());

  const missing: string[] = [];
  const picked: string[] = [];
  const resultMap: Record<string, string> = {};

  if (options.invert) {
    // Keep everything EXCEPT the specified keys
    for (const key of allKeys) {
      if (!requestedKeys.includes(key)) {
        resultMap[key] = envMap[key];
        picked.push(key);
      }
    }
    // Track which requested keys were actually present (for reporting)
    for (const key of requestedKeys) {
      if (!allKeys.includes(key)) {
        missing.push(key);
      }
    }
  } else {
    for (const key of requestedKeys) {
      if (key in envMap) {
        resultMap[key] = envMap[key];
        picked.push(key);
      } else {
        missing.push(key);
      }
    }
  }

  const outputPath = options.output ?? ".env";
  const serialized = serializeEnvFile(resultMap);
  fs.writeFileSync(outputPath, serialized, "utf8");

  return { picked, missing, outputPath, invert: options.invert ?? false };
}

/**
 * Format the result of a pick operation into a human-readable string.
 */
export function formatPickResult(result: PickResult): string {
  const lines: string[] = [];

  const verb = result.invert ? "Excluded" : "Picked";

  if (result.picked.length > 0) {
    lines.push(`${verb} ${result.picked.length} key(s) → ${result.outputPath}`);
    for (const key of result.picked) {
      lines.push(`  ✔ ${key}`);
    }
  } else {
    lines.push(`No keys ${result.invert ? "remaining after exclusion" : "matched"}.`);
  }

  if (result.missing.length > 0) {
    const missingLabel = result.invert
      ? "Requested exclusion keys not found in vault"
      : "Requested keys not found in vault";
    lines.push(`\n${missingLabel}:`);
    for (const key of result.missing) {
      lines.push(`  ✘ ${key}`);
    }
  }

  return lines.join("\n");
}
