import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { runAudit, formatAuditResult } from "./audit";
import { encryptEnvFile } from "../crypto/vault";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-audit-test-"));
}

describe("runAudit", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns empty result when no vault dir exists", async () => {
    const result = await runAudit(tmpDir);
    expect(result.totalVaults).toBe(0);
    expect(result.entries).toHaveLength(0);
  });

  it("detects vaults with matching env files", async () => {
    const envContent = "KEY=value\n";
    fs.writeFileSync(path.join(tmpDir, ".env.test"), envContent);
    await encryptEnvFile(path.join(tmpDir, ".env.test"), "password");

    const result = await runAudit(tmpDir);
    expect(result.totalVaults).toBe(1);
    expect(result.entries[0].vault).toBe("test");
    expect(result.entries[0].hasCorrespondingEnv).toBe(true);
    expect(result.orphanedVaults).toBe(0);
  });

  it("detects orphaned vaults (no matching env file)", async () => {
    const envContent = "KEY=value\n";
    const envPath = path.join(tmpDir, ".env.staging");
    fs.writeFileSync(envPath, envContent);
    await encryptEnvFile(envPath, "password");
    fs.unlinkSync(envPath); // remove env, leave vault

    const result = await runAudit(tmpDir);
    expect(result.totalVaults).toBe(1);
    expect(result.entries[0].hasCorrespondingEnv).toBe(false);
    expect(result.orphanedVaults).toBe(1);
  });
});

describe("formatAuditResult", () => {
  it("shows message when no vaults found", () => {
    const result = formatAuditResult({ entries: [], totalVaults: 0, orphanedVaults: 0 });
    expect(result).toContain("No vaults found");
  });

  it("lists vaults with status", () => {
    const result = formatAuditResult({
      entries: [
        { vault: "production", lastModified: new Date("2024-01-01"), sizeBytes: 256, hasCorrespondingEnv: true },
        { vault: "staging", lastModified: new Date("2024-01-02"), sizeBytes: 128, hasCorrespondingEnv: false },
      ],
      totalVaults: 2,
      orphanedVaults: 1,
    });
    expect(result).toContain("production");
    expect(result).toContain("staging");
    expect(result).toContain("orphaned");
    expect(result).toContain("1 orphaned");
  });
});
