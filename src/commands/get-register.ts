import { Command } from 'commander';
import { resolvePassword } from '../cli';
import { runGet, formatGetResult } from './get';

export function registerGetCommand(program: Command): void {
  program
    .command('get <env-file> <key>')
    .description('Retrieve a single key value from an encrypted vault')
    .option('-p, --password <password>', 'encryption password')
    .option('--raw', 'output only the raw value without the key name')
    .action(async (envFile: string, key: string, opts: { password?: string; raw?: boolean }) => {
      try {
        const password = await resolvePassword(opts.password);
        const result = await runGet(envFile, key, password);
        console.log(formatGetResult(result, opts.raw ?? false));
        if (!result.found) {
          process.exit(1);
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
