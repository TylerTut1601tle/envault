import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { decryptVaultFile } from "../crypto/vault";
import { parseEnvFile } from "../env/parser";
import { formatSetResult, runSet } from "./set";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-set-test-"));
}

describe("runSet", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("creates a new vault with the key when vault does not exist", async () => {
    const result = await runSet(tmpDir, ".env", "API_KEY", "secret123", "password");
    expect(result.created).toBe(true);
    expect(result.updated).toBe(false);
    expect(result.key).toBe("API_KEY");
  });

  it("decrypted vault contains the set key", async () => {
    await runSet(tmpDir, ".env", "API_KEY", "secret123", "password");
    const decrypted = await decryptVaultFile(result_path(tmpDir), "password");
    const entries = parseEnvFile(decrypted);
    expect(entries["API_KEY"]).toBe("secret123");
  });

  it("updates an existing key without marking as created", async () => {
    await runSet(tmpDir, ".env", "API_KEY", "first", "password");
    const result = await runSet(tmpDir, ".env", "API_KEY", "second", "password");
    expect(result.created).toBe(false);
    expect(result.updated).toBe(true);
  });

  it("preserves other keys when updating", async () => {
    await runSet(tmpDir, ".env", "FOO", "bar", "password");
    await runSet(tmpDir, ".env", "BAZ", "qux", "password");
    const decrypted = await decryptVaultFile(result_path(tmpDir), "password");
    const entries = parseEnvFile(decrypted);
    expect(entries["FOO"]).toBe("bar");
    expect(entries["BAZ"]).toBe("qux");
  });

  it("throws when vault exists but is not a valid vault file", async () => {
    const vaultPath = path.join(tmpDir, ".env.vault");
    fs.writeFileSync(vaultPath, "not-a-vault");
    await expect(runSet(tmpDir, ".env", "KEY", "val", "password")).rejects.toThrow();
  });
});

describe("formatSetResult", () => {
  it("shows created message", () => {
    const msg = formatSetResult({ vaultPath: ".env.vault", key: "FOO", created: true, updated: false });
    expect(msg).toContain("created");
    expect(msg).toContain("FOO");
  });

  it("shows updated message", () => {
    const msg = formatSetResult({ vaultPath: ".env.vault", key: "BAR", created: false, updated: true });
    expect(msg).toContain("updated");
    expect(msg).toContain("BAR");
  });
});

function result_path(dir: string): string {
  return path.join(dir, ".env.vault");
}
