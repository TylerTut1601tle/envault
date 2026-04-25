import { Command } from 'commander';
import { resolvePassword } from '../cli';
import { runSlice, formatSliceResult } from './slice';

export function registerSliceCommand(program: Command): void {
  program
    .command('slice <vault> <keys...>')
    .description('Extract a subset of keys from a vault into a new file or stdout')
    .option('-o, --output <file>', 'Write sliced keys to this file')
    .option('-p, --password <password>', 'Encryption password')
    .action(async (vault: string, keys: string[], opts: { output?: string; password?: string }) => {
      try {
        const password = await resolvePassword(opts.password);
        const result = await runSlice(vault, {
          keys,
          output: opts.output,
          password,
        });
        console.log(formatSliceResult(result));
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
