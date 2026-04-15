import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { encryptEnvFile, decryptVaultFile } from "../crypto/vault";
import { rekeyVaults, formatRekeyResult } from "./rekey";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-rekey-"));
}

describe("rekeyVaults", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("re-encrypts a vault with a new password", async () => {
    const envPath = path.join(tmpDir, "test.env");
    fs.writeFileSync(envPath, "API_KEY=hello\nSECRET=world\n");
    const vaultPath = await encryptEnvFile(envPath, "oldpass", tmpDir);

    const result = await rekeyVaults(tmpDir, "oldpass", "newpass", [vaultPath]);

    expect(result.rekeyed).toHaveLength(1);
    expect(result.failed).toHaveLength(0);
    expect(result.skipped).toHaveLength(0);

    const decrypted = await decryptVaultFile(vaultPath, "newpass");
    expect(decrypted).toContain("API_KEY=hello");
  });

  it("fails with wrong old password", async () => {
    const envPath = path.join(tmpDir, "test.env");
    fs.writeFileSync(envPath, "FOO=bar\n");
    const vaultPath = await encryptEnvFile(envPath, "correct", tmpDir);

    const result = await rekeyVaults(tmpDir, "wrong", "newpass", [vaultPath]);

    expect(result.failed).toHaveLength(1);
    expect(result.rekeyed).toHaveLength(0);
  });

  it("skips vaults that do not exist", async () => {
    const fakePath = path.join(tmpDir, "ghost.vault");
    const result = await rekeyVaults(tmpDir, "pass", "newpass", [fakePath]);

    expect(result.skipped).toHaveLength(1);
    expect(result.rekeyed).toHaveLength(0);
  });
});

describe("formatRekeyResult", () => {
  it("formats a successful rekey", () => {
    const output = formatRekeyResult({
      rekeyed: ["/project/.envault/prod.vault"],
      failed: [],
      skipped: [],
    });
    expect(output).toContain("Rekeyed");
    expect(output).toContain("prod.vault");
  });

  it("shows no vaults message when empty", () => {
    const output = formatRekeyResult({ rekeyed: [], failed: [], skipped: [] });
    expect(output).toContain("No vaults found");
  });

  it("formats failures with error message", () => {
    const output = formatRekeyResult({
      rekeyed: [],
      failed: [{ vault: "/project/.envault/dev.vault", error: "bad decrypt" }],
      skipped: [],
    });
    expect(output).toContain("Failed");
    expect(output).toContain("bad decrypt");
  });
});
