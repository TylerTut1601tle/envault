import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { describe, it, expect, beforeEach } from "vitest";
import { encryptEnvFile, decryptVaultFile, getVaultPath } from "../crypto/vault";
import { runShuffle, formatShuffleResult } from "./shuffle";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-shuffle-"));
}

describe("runShuffle", () => {
  let tmpDir: string;
  const password = "test-password-123";
  const envContent = "ALPHA=1\nBETA=2\nGAMMA=3\nDELTA=4\nEPSILON=5\n";

  beforeEach(async () => {
    tmpDir = makeTempDir();
    const vaultPath = getVaultPath(".env", tmpDir);
    fs.mkdirSync(path.dirname(vaultPath), { recursive: true });
    await encryptEnvFile(envContent, vaultPath, password);
  });

  it("returns error when vault does not exist", async () => {
    const empty = makeTempDir();
    const result = await runShuffle(".env", password, empty);
    expect(result.success).toBe(false);
    expect(result.error).toMatch(/Vault not found/);
  });

  it("returns error on wrong password", async () => {
    const result = await runShuffle(".env", "wrong-password", tmpDir);
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("shuffles and re-encrypts the vault successfully", async () => {
    const result = await runShuffle(".env", password, tmpDir);
    expect(result.success).toBe(true);
    expect(result.keyCount).toBe(5);
  });

  it("preserves all keys after shuffle", async () => {
    await runShuffle(".env", password, tmpDir);
    const vaultPath = getVaultPath(".env", tmpDir);
    const decrypted = await decryptVaultFile(vaultPath, password);
    expect(decrypted).toContain("ALPHA=1");
    expect(decrypted).toContain("BETA=2");
    expect(decrypted).toContain("GAMMA=3");
    expect(decrypted).toContain("DELTA=4");
    expect(decrypted).toContain("EPSILON=5");
  });
});

describe("formatShuffleResult", () => {
  it("formats success result", () => {
    const out = formatShuffleResult({
      vaultPath: ".envault/.env.vault",
      keyCount: 5,
      success: true,
    });
    expect(out).toContain("✓");
    expect(out).toContain("5 key(s)");
  });

  it("formats error result", () => {
    const out = formatShuffleResult({
      vaultPath: ".envault/.env.vault",
      keyCount: 0,
      success: false,
      error: "bad password",
    });
    expect(out).toContain("✗");
    expect(out).toContain("bad password");
  });
});
