import { Command } from 'commander';
import { runDelete } from './delete';
import { resolvePassword } from '../cli';

export function registerDeleteCommand(program: Command): void {
  program
    .command('delete <vault>')
    .description('Delete a vault file and its decrypted counterpart')
    .option('-p, --password <password>', 'encryption password')
    .option('-f, --force', 'skip confirmation prompt')
    .action(async (vault: string, opts: { password?: string; force?: boolean }) => {
      const password = await resolvePassword(opts.password);
      const result = await runDelete(vault, password, { force: opts.force });
      console.log(result.message);
      if (!result.success) process.exit(1);
    });
}
