import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { runExport, formatExportResult } from "./export";
import { encryptEnvFile } from "../crypto/vault";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-export-test-"));
}

describe("runExport", () => {
  let tmpDir: string;
  const password = "test-password-export";

  beforeEach(() => {
    tmpDir = makeTempDir();
    fs.mkdirSync(path.join(tmpDir, ".envault"), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("exports a vault to a .env file", async () => {
    const envContent = "API_KEY=abc123\nDB_URL=postgres://localhost/db\n";
    const srcPath = path.join(tmpDir, ".env.staging");
    fs.writeFileSync(srcPath, envContent);
    await encryptEnvFile(srcPath, "staging", password, tmpDir);

    const result = await runExport("staging", password, undefined, tmpDir);

    expect(result.success).toBe(true);
    expect(result.keyCount).toBe(2);
    expect(fs.existsSync(result.outputPath)).toBe(true);
    const exported = fs.readFileSync(result.outputPath, "utf-8");
    expect(exported).toContain("API_KEY=abc123");
    expect(exported).toContain("DB_URL=postgres://localhost/db");
  });

  it("exports to a custom output path", async () => {
    const srcPath = path.join(tmpDir, ".env.prod");
    fs.writeFileSync(srcPath, "SECRET=mysecret\n");
    await encryptEnvFile(srcPath, "prod", password, tmpDir);

    const customOut = path.join(tmpDir, "custom-output.env");
    const result = await runExport("prod", password, customOut, tmpDir);

    expect(result.success).toBe(true);
    expect(result.outputPath).toBe(customOut);
    expect(fs.existsSync(customOut)).toBe(true);
  });

  it("fails when vault does not exist", async () => {
    const result = await runExport("nonexistent", password, undefined, tmpDir);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/not found/);
  });

  it("fails with wrong password", async () => {
    const srcPath = path.join(tmpDir, ".env.dev");
    fs.writeFileSync(srcPath, "KEY=value\n");
    await encryptEnvFile(srcPath, "dev", password, tmpDir);

    const result = await runExport("dev", "wrong-password", undefined, tmpDir);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Decryption failed/);
  });
});

describe("formatExportResult", () => {
  it("formats success", () => {
    const msg = formatExportResult({ success: true, outputPath: "/tmp/.env.staging", keyCount: 3 });
    expect(msg).toContain("✅");
    expect(msg).toContain("3 key(s)");
    expect(msg).toContain("/tmp/.env.staging");
  });

  it("formats failure", () => {
    const msg = formatExportResult({ success: false, outputPath: "", keyCount: 0, error: "Bad password" });
    expect(msg).toContain("❌");
    expect(msg).toContain("Bad password");
  });
});
