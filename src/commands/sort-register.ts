import { Command } from 'commander';
import { resolvePassword } from '../cli';
import { runSort, formatSortResult } from './sort';

export function registerSortCommand(program: Command): void {
  program
    .command('sort <envFile>')
    .description('Sort keys in a vault file alphabetically')
    .option('-r, --reverse', 'Sort in reverse order')
    .option('--by-value', 'Sort by value instead of key')
    .option('-p, --password <password>', 'Encryption password')
    .action(async (envFile: string, opts) => {
      try {
        const password = await resolvePassword(opts.password);
        const result = await runSort(envFile, password, {
          reverse: opts.reverse,
          byValue: opts.byValue,
        });
        console.log(formatSortResult(result));
      } catch (err: any) {
        console.error(`❌ ${err.message}`);
        process.exit(1);
      }
    });
}
