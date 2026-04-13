import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { diffEnvFiles, formatDiff, runDiff } from "./diff";
import { encryptEnvFile } from "../crypto/vault";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-diff-test-"));
}

describe("diffEnvFiles", () => {
  it("detects added keys", () => {
    const original = { FOO: "bar" };
    const updated = { FOO: "bar", NEW_KEY: "value" };
    const diff = diffEnvFiles(original, updated);
    expect(diff.added).toContain("NEW_KEY");
    expect(diff.changed).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
  });

  it("detects removed keys", () => {
    const original = { FOO: "bar", OLD_KEY: "old" };
    const updated = { FOO: "bar" };
    const diff = diffEnvFiles(original, updated);
    expect(diff.removed).toContain("OLD_KEY");
  });

  it("detects changed keys", () => {
    const original = { FOO: "bar" };
    const updated = { FOO: "baz" };
    const diff = diffEnvFiles(original, updated);
    expect(diff.changed).toContain("FOO");
  });

  it("detects unchanged keys", () => {
    const original = { FOO: "bar" };
    const updated = { FOO: "bar" };
    const diff = diffEnvFiles(original, updated);
    expect(diff.unchanged).toContain("FOO");
    expect(diff.changed).toHaveLength(0);
  });

  it("returns no differences for identical files", () => {
    const env = { A: "1", B: "2" };
    const diff = diffEnvFiles(env, { ...env });
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
    expect(diff.changed).toHaveLength(0);
  });
});

describe("formatDiff", () => {
  it("returns no differences message when empty", () => {
    const diff = { added: [], removed: [], changed: [], unchanged: ["FOO"] };
    expect(formatDiff(diff)).toBe("No differences found.");
  });

  it("formats added, removed, changed keys", () => {
    const diff = { added: ["NEW"], removed: ["OLD"], changed: ["MOD"], unchanged: [] };
    const output = formatDiff(diff);
    expect(output).toContain("+ NEW");
    expect(output).toContain("- OLD");
    expect(output).toContain("~ MOD");
  });
});

describe("runDiff", () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTempDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true, force: true }); });

  it("detects changes between env file and vault", async () => {
    const envPath = path.join(tmpDir, ".env");
    const password = "test-password";
    const original = "FOO=bar\nBAZ=qux\n";
    fs.writeFileSync(envPath, original);
    await encryptEnvFile(envPath, password);
    fs.writeFileSync(envPath, "FOO=changed\nNEW=added\n");
    const { diff } = await runDiff(envPath, password);
    expect(diff.changed).toContain("FOO");
    expect(diff.added).toContain("NEW");
    expect(diff.removed).toContain("BAZ");
  });

  it("throws if env file does not exist", async () => {
    await expect(runDiff(path.join(tmpDir, ".env"), "pass")).rejects.toThrow("Env file not found");
  });

  it("throws if vault file does not exist", async () => {
    const envPath = path.join(tmpDir, ".env");
    fs.writeFileSync(envPath, "FOO=bar\n");
    await expect(runDiff(envPath, "pass")).rejects.toThrow("Vault file not found");
  });
});
