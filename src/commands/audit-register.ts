import type { Argv } from "yargs";
import { runAudit, formatAuditResult } from "./audit";

export function registerAuditCommand(yargs: Argv): Argv {
  return yargs.command(
    "audit",
    "Audit vaults and report orphaned or stale entries",
    (y) =>
      y.option("cwd", {
        type: "string",
        description: "Working directory",
        default: process.cwd(),
      }),
    async (argv) => {
      const cwd = argv.cwd as string;
      try {
        const result = await runAudit(cwd);
        console.log(formatAuditResult(result));
        if (result.orphanedVaults > 0) {
          process.exitCode = 1;
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`audit failed: ${message}`);
        process.exit(1);
      }
    }
  );
}
