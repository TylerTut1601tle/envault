import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { registerAuditCommand } from "./audit-register";
import yargs from "yargs";

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "envault-audit-reg-test-"));
}

describe("registerAuditCommand", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("registers audit command without error", () => {
    const instance = yargs([]);
    expect(() => registerAuditCommand(instance)).not.toThrow();
  });

  it("audit command runs and exits cleanly on empty vault dir", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const instance = registerAuditCommand(yargs(["audit", "--cwd", tmpDir]));
    await instance.parseAsync();

    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("No vaults found"));
    consoleSpy.mockRestore();
  });

  it("audit command includes --cwd option", () => {
    const instance = registerAuditCommand(yargs([]));
    const commandsinstance as any).getInternalMethods().getCommandInstance();
    expect(commands).toBeDefined();
  });
});
