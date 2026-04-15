import { Command } from 'commander';
import { packVaults, formatPackResult } from './pack';
import { resolvePassword } from '../cli';

export function registerPackCommand(program: Command): void {
  program
    .command('pack')
    .description('Bundle all tracked encrypted vaults into a single portable archive file')
    .argument('<output>', 'Output file path for the packed bundle (e.g. envault-bundle.json)')
    .option('-p, --password <password>', 'Encryption password')
    .option('-d, --dir <dir>', 'Working directory', process.cwd())
    .action(async (output: string, options: { password?: string; dir: string }) => {
      const password = await resolvePassword(options.password);
      const result = await packVaults(options.dir, output, password);
      console.log(formatPackResult(result));
      if (result.error) {
        process.exit(1);
      }
    });
}
