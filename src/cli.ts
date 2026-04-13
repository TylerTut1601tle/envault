#!/usr/bin/env node
import { Command } from "commander";
import * as path from "path";
import * as fs from "fs";
import { runInit, formatInitResult } from "./commands/init";
import { runLock } from "./commands/lock";
import { runUnlock } from "./commands/unlock";
import { runStatus, formatStatus } from "./commands/status";
import { runList, formatList } from "./commands/list";
import { runRotate, formatRotateResult } from "./commands/rotate";
import { runAdd, formatAddResult } from "./commands/add";
import { runPull, formatPullResult } from "./commands/pull";
import { runPush, formatPushResult } from "./commands/push";
import { runEdit, formatEditResult } from "./commands/edit";
import { runInfo, formatInfo } from "./commands/info";
import { runDiff } from "./commands/diff";

const program = new Command();

program
  .name("envault")
  .description("Manage and encrypt local .env files with team-sharing support")
  .version("0.1.0");

function resolvePassword(opts: { password?: string; passwordFile?: string }): string {
  if (opts.password) return opts.password;
  if (opts.passwordFile) {
    const filePath = path.resolve(opts.passwordFile);
    if (!fs.existsSync(filePath)) throw new Error(`Password file not found: ${filePath}`);
    return fs.readFileSync(filePath, "utf-8").trim();
  }
  throw new Error("A password is required. Use --password or --password-file.");
}

program.command("init")
  .description("Initialize envault in the current Git repository")
  .option("--vault-dir <dir>", "Directory to store vault files", ".envault")
  .action(async (opts) => {
    const result = await runInit(process.cwd(), opts.vaultDir);
    console.log(formatInitResult(result));
  });

program.command("lock [env-file]")
  .description("Encrypt a .env file into a vault")
  .option("--password <password>", "Encryption password")
  .option("--password-file <path>", "Path to file containing the password")
  .action(async (envFile = ".env", opts) => {
    const password = resolvePassword(opts);
    await runLock(path.resolve(envFile), password);
    console.log(`Locked: ${envFile}`);
  });

program.command("unlock [env-file]")
  .description("Decrypt a vault file into a .env file")
  .option("--password <password>", "Decryption password")
  .option("--password-file <path>", "Path to file containing the password")
  .action(async (envFile = ".env", opts) => {
    const password = resolvePassword(opts);
    await runUnlock(path.resolve(envFile), password);
    console.log(`Unlocked: ${envFile}`);
  });

program.command("diff [env-file]")
  .description("Show differences between current .env and its vault snapshot")
  .option("--password <password>", "Decryption password")
  .option("--password-file <path>", "Path to file containing the password")
  .action(async (envFile = ".env", opts) => {
    const password = resolvePassword(opts);
    const { output } = await runDiff(path.resolve(envFile), password);
    console.log(output);
  });

program.command("status")
  .description("Show lock status of tracked .env files")
  .action(async () => {
    const result = await runStatus(process.cwd());
    console.log(formatStatus(result));
  });

program.command("list")
  .description("List all tracked vault files")
  .action(async () => {
    const result = await runList(process.cwd());
    console.log(formatList(result));
  });

program.command("rotate [env-file]")
  .description("Re-encrypt a vault with a new password")
  .option("--password <password>", "Current password")
  .option("--password-file <path>", "Path to file containing the current password")
  .option("--new-password <password>", "New encryption password")
  .action(async (envFile = ".env", opts) => {
    const password = resolvePassword(opts);
    const newPassword = opts.newPassword;
    if (!newPassword) throw new Error("--new-password is required");
    const result = await runRotate(path.resolve(envFile), password, newPassword);
    console.log(formatRotateResult(result));
  });

program.parseAsync(process.argv).catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
