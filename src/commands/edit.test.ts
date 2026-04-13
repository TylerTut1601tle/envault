import fs from "fs";
import path from "path";
import os from "os";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { runEdit, formatEditResult } from "./edit";
import { encryptEnvFile } from "../crypto/vault";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-edit-test-"));
}

describe("runEdit", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it("returns error if no vault exists", async () => {
    const envFile = path.join(tmpDir, ".env");
    const result = await runEdit(envFile, "secret");
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/No vault found/);
    expect(result.changed).toBe(false);
  });

  it("returns unchanged if editor makes no changes", async () => {
    const envFile = path.join(tmpDir, ".env");
    fs.writeFileSync(envFile, "FOO=bar\nBAZ=qux\n", "utf-8");
    await encryptEnvFile(envFile, "passphrase");
    fs.unlinkSync(envFile);

    const { spawnSync } = await import("child_process");
    vi.spyOn(await import("child_process"), "spawnSync").mockImplementation(
      (_cmd: string, args: readonly string[]) => {
        // no-op: don't change file
        return { status: 0, error: undefined } as any;
      }
    );

    const result = await runEdit(envFile, "passphrase");
    expect(result.success).toBe(true);
    expect(result.changed).toBe(false);
    expect(result.message).toMatch(/No changes/);
  });

  it("re-encrypts vault when editor changes content", async () => {
    const envFile = path.join(tmpDir, ".env");
    fs.writeFileSync(envFile, "FOO=bar\n", "utf-8");
    await encryptEnvFile(envFile, "passphrase");
    fs.unlinkSync(envFile);

    vi.spyOn(await import("child_process"), "spawnSync").mockImplementation(
      (_cmd: string, args: readonly string[]) => {
        const tmpFile = (args as string[])[0];
        fs.writeFileSync(tmpFile, "FOO=bar\nNEW=value\n", "utf-8");
        return { status: 0, error: undefined } as any;
      }
    );

    const result = await runEdit(envFile, "passphrase");
    expect(result.success).toBe(true);
    expect(result.changed).toBe(true);
    expect(result.message).toMatch(/Vault updated/);
    expect(fs.existsSync(envFile)).toBe(false);
  });
});

describe("formatEditResult", () => {
  it("formats failure", () => {
    expect(formatEditResult({ success: false, message: "err", envFile: ".env", vaultFile: ".env.vault", changed: false })).toMatch(/✖/);
  });

  it("formats unchanged", () => {
    expect(formatEditResult({ success: true, message: "No changes made.", envFile: ".env", vaultFile: ".env.vault", changed: false })).toMatch(/○/);
  });

  it("formats changed", () => {
    expect(formatEditResult({ success: true, message: "Vault updated for .env.", envFile: ".env", vaultFile: ".env.vault", changed: true })).toMatch(/✔/);
  });
});
