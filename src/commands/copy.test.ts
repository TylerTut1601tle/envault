import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { runCopy, formatCopyResult } from "./copy";
import { encryptEnvFile, getVaultPath } from "../crypto/vault";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-copy-test-"));
}

const PASSWORD = "test-password-123";
const SAMPLE_ENV = `API_KEY=abc123\nDB_URL=postgres://localhost/dev\n`;

describe("runCopy", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
    fs.mkdirSync(path.join(tmpDir, ".envault"), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("copies a vault to a new destination", async () => {
    const sourceVault = getVaultPath(".env", tmpDir);
    await encryptEnvFile(SAMPLE_ENV, sourceVault, PASSWORD);

    const result = await runCopy(".env", ".env.staging", PASSWORD, tmpDir);

    expect(result.source).toBe(".env");
    expect(result.destination).toBe(".env.staging");
    expect(result.keyCount).toBe(2);
    expect(result.overwrote).toBe(false);

    const destVault = getVaultPath(".env.staging", tmpDir);
    expect(fs.existsSync(destVault)).toBe(true);
  });

  it("sets overwrote=true when destination already exists", async () => {
    const sourceVault = getVaultPath(".env", tmpDir);
    await encryptEnvFile(SAMPLE_ENV, sourceVault, PASSWORD);

    const destVault = getVaultPath(".env.staging", tmpDir);
    await encryptEnvFile(`OTHER=val\n`, destVault, PASSWORD);

    const result = await runCopy(".env", ".env.staging", PASSWORD, tmpDir);
    expect(result.overwrote).toBe(true);
    expect(result.keyCount).toBe(2);
  });

  it("throws when source vault does not exist", async () => {
    await expect(
      runCopy(".env.missing", ".env.dest", PASSWORD, tmpDir)
    ).rejects.toThrow("Source vault not found");
  });
});

describe("formatCopyResult", () => {
  it("formats a copy result without overwrite", () => {
    const output = formatCopyResult({
      source: ".env",
      destination: ".env.staging",
      keyCount: 3,
      overwrote: false,
    });
    expect(output).toContain(".env → .env.staging");
    expect(output).toContain("Keys copied : 3");
    expect(output).not.toContain("overwritten");
  });

  it("formats a copy result with overwrite warning", () => {
    const output = formatCopyResult({
      source: ".env",
      destination: ".env.prod",
      keyCount: 5,
      overwrote: true,
    });
    expect(output).toContain("overwritten");
  });
});
