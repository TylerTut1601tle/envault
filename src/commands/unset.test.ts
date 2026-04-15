import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { encryptEnvFile, getVaultPath } from "../crypto/vault";
import { formatUnsetResult, runUnset } from "./unset";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-unset-"));
}

const PASSWORD = "test-password-123";
const INITIAL_ENV = "API_KEY=abc123\nDB_URL=postgres://localhost/db\nDEBUG=true\n";

async function setupVault(dir: string, envName = ".env"): Promise<string> {
  const vaultPath = getVaultPath(dir, envName);
  await encryptEnvFile(vaultPath, INITIAL_ENV, PASSWORD);
  return vaultPath;
}

describe("runUnset", () => {
  it("removes a single key from the vault", async () => {
    const dir = makeTempDir();
    await setupVault(dir);
    const result = await runUnset(dir, ".env", ["API_KEY"], PASSWORD);
    expect(result.removedKeys).toEqual(["API_KEY"]);
    expect(result.notFoundKeys).toEqual([]);
    expect(result.totalRemaining).toBe(2);
  });

  it("removes multiple keys from the vault", async () => {
    const dir = makeTempDir();
    await setupVault(dir);
    const result = await runUnset(dir, ".env", ["API_KEY", "DEBUG"], PASSWORD);
    expect(result.removedKeys).toContain("API_KEY");
    expect(result.removedKeys).toContain("DEBUG");
    expect(result.totalRemaining).toBe(1);
  });

  it("reports not-found keys without failing", async () => {
    const dir = makeTempDir();
    await setupVault(dir);
    const result = await runUnset(dir, ".env", ["MISSING_KEY"], PASSWORD);
    expect(result.removedKeys).toEqual([]);
    expect(result.notFoundKeys).toEqual(["MISSING_KEY"]);
    expect(result.totalRemaining).toBe(3);
  });

  it("handles mix of found and not-found keys", async () => {
    const dir = makeTempDir();
    await setupVault(dir);
    const result = await runUnset(dir, ".env", ["DB_URL", "GHOST"], PASSWORD);
    expect(result.removedKeys).toEqual(["DB_URL"]);
    expect(result.notFoundKeys).toEqual(["GHOST"]);
    expect(result.totalRemaining).toBe(2);
  });

  it("throws if vault does not exist", async () => {
    const dir = makeTempDir();
    await expect(runUnset(dir, ".env", ["KEY"], PASSWORD)).rejects.toThrow("Vault not found");
  });

  it("throws if no keys are specified", async () => {
    const dir = makeTempDir();
    await setupVault(dir);
    await expect(runUnset(dir, ".env", [], PASSWORD)).rejects.toThrow("No keys specified");
  });
});

describe("formatUnsetResult", () => {
  it("formats a successful unset result", () => {
    const result = {
      vaultFile: ".env.vault",
      removedKeys: ["API_KEY"],
      notFoundKeys: [],
      totalRemaining: 2,
    };
    const output = formatUnsetResult(result);
    expect(output).toContain("Removed 1 key(s)");
    expect(output).toContain("API_KEY");
    expect(output).toContain("2 key(s) remaining");
  });

  it("formats not-found keys in output", () => {
    const result = {
      vaultFile: ".env.vault",
      removedKeys: [],
      notFoundKeys: ["GHOST"],
      totalRemaining: 3,
    };
    const output = formatUnsetResult(result);
    expect(output).toContain("not found");
    expect(output).toContain("GHOST");
  });
});
