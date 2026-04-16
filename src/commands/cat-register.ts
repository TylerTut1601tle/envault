import { Command } from 'commander';
import { resolvePassword } from '../cli';
import { runCat, formatCatResult } from './cat';

export function registerCatCommand(program: Command): void {
  program
    .command('cat [env]')
    .description('Print decrypted contents of a vault to stdout')
    .option('-p, --password <password>', 'encryption password')
    .action(async (env: string | undefined, opts: { password?: string }) => {
      const password = await resolvePassword(opts.password);
      const result = await runCat({ env, password });
      console.log(formatCatResult(result));
      if (!result.success) process.exit(1);
    });
}
