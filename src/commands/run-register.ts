import type { Argv } from "yargs";
import { resolvePassword } from "../cli";
import { getVaultPath } from "../crypto/vault";
import { runWithEnv, formatRunResult } from "./run";

export function registerRunCommand(yargs: Argv): Argv {
  return yargs.command(
    "run <env> -- <command..>",
    "Run a command with decrypted env variables injected",
    (y) =>
      y
        .positional("env", {
          type: "string",
          description: "Name of the vault/env to use (e.g. staging)",
          demandOption: true,
        })
        .positional("command", {
          type: "string",
          array: true,
          description: "Command to run",
          demandOption: true,
        })
        .option("password", {
          alias: "p",
          type: "string",
          description: "Encryption password",
        })
        .option("dir", {
          type: "string",
          description: "Working directory for the command",
        }),
    async (argv) => {
      const password = await resolvePassword(argv.password);
      const vaultPath = getVaultPath(argv.env as string);
      const command = argv.command as string[];

      const result = await runWithEnv(
        vaultPath,
        password,
        command,
        argv.dir as string | undefined
      );

      if (result.error) {
        console.error(formatRunResult(result));
        process.exit(result.exitCode);
      }

      process.exit(result.exitCode);
    }
  );
}
