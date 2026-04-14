import type { Command } from "commander";
import { resolvePassword } from "../cli";
import { formatSetResult, runSet } from "./set";

export function registerSetCommand(program: Command): void {
  program
    .command("set <key> <value>")
    .description("Set or update a key-value pair in a vault")
    .option("-e, --env <file>", "env file name (without .vault extension)", ".env")
    .option("-p, --password <password>", "encryption password")
    .action(async (key: string, value: string, options: { env: string; password?: string }) => {
      try {
        const password = await resolvePassword(options.password);
        const result = await runSet(process.cwd(), options.env, key, value, password);
        console.log(formatSetResult(result));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    });
}
