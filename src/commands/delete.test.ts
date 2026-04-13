import fs from "fs";
import os from "os";
import path from "path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { encryptEnvFile, getVaultPath } from "../crypto/vault";
import { runDelete, formatDeleteResult } from "./delete";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-delete-test-"));
}

describe("runDelete", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns error when vault does not exist", async () => {
    const envFile = path.join(tmpDir, ".env");
    const result = await runDelete(envFile, { cwd: tmpDir });
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/not found/);
  });

  it("deletes an existing vault file", async () => {
    const envFile = path.join(tmpDir, ".env");
    fs.writeFileSync(envFile, "API_KEY=secret\n");
    await encryptEnvFile(envFile, "password123");
    const vaultPath = getVaultPath(envFile);
    expect(fs.existsSync(vaultPath)).toBe(true);

    const result = await runDelete(envFile, { cwd: tmpDir });
    expect(result.success).toBe(true);
    expect(fs.existsSync(vaultPath)).toBe(false);
  });

  it("returns error for non-vault file", async () => {
    const envFile = path.join(tmpDir, ".env");
    const vaultPath = getVaultPath(envFile);
    fs.writeFileSync(vaultPath, "not-a-vault-content");

    const result = await runDelete(envFile, { cwd: tmpDir });
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/valid vault/);
  });
});

describe("formatDeleteResult", () => {
  it("formats a successful result", () => {
    const output = formatDeleteResult({
      success: true,
      vaultPath: "/tmp/.env.vault",
      envFile: "/tmp/.env",
      message: "Vault deleted successfully",
    });
    expect(output).toContain("✓");
    expect(output).toContain(".env.vault");
  });

  it("formats a failure result", () => {
    const output = formatDeleteResult({
      success: false,
      vaultPath: "/tmp/.env.vault",
      envFile: "/tmp/.env",
      message: "Vault file not found",
    });
    expect(output).toContain("✗");
    expect(output).toContain("not found");
  });
});
