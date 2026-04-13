import { Command } from "commander";
import { runCopy, formatCopyResult } from "./copy";
import { resolvePassword } from "../cli";

export function registerCopyCommand(program: Command): void {
  program
    .command("copy <source> <destination>")
    .description("Copy an encrypted vault to a new destination")
    .option("-p, --password <password>", "Encryption password")
    .option("--cwd <dir>", "Working directory", process.cwd())
    .action(async (source: string, destination: string, opts) => {
      try {
        const password = await resolvePassword(opts.password);
        const result = await runCopy(source, destination, password, opts.cwd);
        console.log(formatCopyResult(result));
      } catch (err: any) {
        console.error(`✖ Error: ${err.message}`);
        process.exit(1);
      }
    });
}
