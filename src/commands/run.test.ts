import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { encryptEnvFile, getVaultPath } from "../crypto/vault";
import { runWithEnv } from "./run";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-run-test-"));
}

/**
 * Helper to create an encrypted vault file with the given env content.
 */
async function makeVault(
  dir: string,
  filename: string,
  envContent: string,
  password: string
): Promise<string> {
  const vaultFile = path.join(dir, filename);
  await encryptEnvFile(envContent, vaultFile, password);
  return vaultFile;
}

describe("runWithEnv", () => {
  let tmpDir: string;
  const password = "test-password-123";

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns error if vault file does not exist", async () => {
    const result = await runWithEnv(
      path.join(tmpDir, "missing.vault"),
      password,
      ["echo", "hello"]
    );
    expect(result.exitCode).toBe(1);
    expect(result.error).toMatch(/not found/);
  });

  it("returns error if password is wrong", async () => {
    const vaultFile = await makeVault(tmpDir, "test.vault", "KEY=value\n", password);

    const result = await runWithEnv(vaultFile, "wrong-password", ["echo", "hi"]);
    expect(result.exitCode).toBe(1);
    expect(result.error).toMatch(/decrypt/);
  });

  it("runs command with injected env variables", async () => {
    const vaultFile = await makeVault(
      tmpDir,
      "test.vault",
      "ENVAULT_TEST_VAR=hello_world\n",
      password
    );

    const result = await runWithEnv(
      vaultFile,
      password,
      ["node", "-e", "process.exit(process.env.ENVAULT_TEST_VAR === 'hello_world' ? 0 : 1)"]
    );
    expect(result.exitCode).toBe(0);
    expect(result.error).toBeUndefined();
  });

  it("returns non-zero exit code when command fails", async () => {
    const vaultFile = await makeVault(tmpDir, "fail.vault", "KEY=val\n", password);

    const result = await runWithEnv(vaultFile, password, ["node", "-e", "process.exit(42)"]);
    expect(result.exitCode).toBe(42);
  });
});
