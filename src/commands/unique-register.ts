import { Command } from 'commander';
import { getUniqueKeys, formatUniqueResult } from './unique';
import { resolvePassword } from '../cli';

export function registerUniqueCommand(program: Command, dir: string): void {
  program
    .command('unique <vault>')
    .description('List unique and duplicate keys in a vault')
    .option('-p, --password <password>', 'Encryption password')
    .option('--duplicates-only', 'Only show duplicate keys')
    .action(async (vault: string, opts: { password?: string; duplicatesOnly?: boolean }) => {
      try {
        const password = await resolvePassword(opts.password);
        const result = await getUniqueKeys(dir, vault, password);

        if (opts.duplicatesOnly) {
          if (result.duplicateKeys.length === 0) {
            console.log('No duplicate keys found.');
          } else {
            console.log(`Duplicate keys in ${result.vault}:`);
            for (const key of result.duplicateKeys) {
              console.log(`  ! ${key}`);
            }
          }
        } else {
          console.log(formatUniqueResult(result));
        }

        if (result.duplicateKeys.length > 0) {
          process.exit(1);
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
