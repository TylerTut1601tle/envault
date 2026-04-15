import { Command } from 'commander';
import path from 'path';
import { resolvePassword } from '../cli';
import { formatCheckResult } from './check';

export function registerCheckCommand(program: Command): void {
  program
    .command('check <vault>')
    .description('Check that a vault can be decrypted with the given password')
    .option('-p, --password <password>', 'encryption password')
    .option('--env-file <file>', 'path to .env file to compare against', '.env')
    .option('--json', 'output result as JSON')
    .action(async (vault: string, opts) => {
      try {
        const password = await resolvePassword(opts.password);
        const vaultPath = path.resolve(vault);
        const envFile = path.resolve(opts.envFile);

        const { runCheck } = await import('./check');
        const result = await runCheck({ vaultPath, envFile, password });

        if (opts.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(formatCheckResult(result));
        }

        if (!result.success) {
          process.exit(1);
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
