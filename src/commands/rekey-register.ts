import { Command } from "commander";
import { resolvePassword } from "../cli";
import { rekeyVaults, formatRekeyResult } from "./rekey";

export function registerRekeyCommand(program: Command): void {
  program
    .command("rekey [vaults...]")
    .description("Re-encrypt vault(s) with a new password")
    .option("-p, --password <password>", "current (old) password")
    .option("-n, --new-password <newPassword>", "new password to re-encrypt with")
    .option("-d, --dir <dir>", "project directory", process.cwd())
    .action(async (vaults: string[], opts) => {
      const dir: string = opts.dir;
      const oldPassword = await resolvePassword(
        opts.password,
        "Enter current password: "
      );
      const newPassword = await resolvePassword(
        opts.newPassword,
        "Enter new password: "
      );
      if (!oldPassword || !newPassword) {
        console.error("Both current and new passwords are required.");
        process.exit(1);
      }
      if (oldPassword === newPassword) {
        console.error("New password must be different from the current password.");
        process.exit(1);
      }
      try {
        const result = await rekeyVaults(dir, oldPassword, newPassword, vaults);
        console.log(formatRekeyResult(result));
        if (result.failed.length > 0) {
          process.exit(1);
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
