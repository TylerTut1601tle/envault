import { Command } from 'commander';
import { runRename } from './rename';
import { resolvePassword } from '../cli';

export function registerRenameCommand(program: Command): void {
  program
    .command('rename <vault> <newName>')
    .description('Rename a vault file')
    .option('-p, --password <password>', 'encryption password')
    .action(async (vault: string, newName: string, opts: { password?: string }) => {
      const password = await resolvePassword(opts.password);
      const result = await runRename(vault, newName, password);
      console.log(result.message);
      if (!result.success) process.exit(1);
    });
}
