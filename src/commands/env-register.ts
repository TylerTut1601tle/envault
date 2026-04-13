import type { Command } from 'commander';
import * as path from 'path';
import { getRepoRoot } from '../git/secrets';
import { resolvePassword } from '../cli';
import { loadEnvVars, formatEnvResult } from './env';

export function registerEnvCommand(program: Command): void {
  program
    .command('env [name]')
    .description('Print decrypted environment variables from a vault')
    .option('-p, --password <password>', 'Encryption password')
    .option(
      '-f, --format <format>',
      'Output format: export | dotenv | json (default: export)',
      'export'
    )
    .action(async (name: string | undefined, opts: { password?: string; format?: string }) => {
      try {
        const repoRoot = await getRepoRoot(process.cwd());
        const envName = name ?? '.env';
        const password = await resolvePassword(opts.password);
        const format = (opts.format ?? 'export') as 'export' | 'dotenv' | 'json';

        if (!['export', 'dotenv', 'json'].includes(format)) {
          console.error(`Invalid format "${format}". Use: export, dotenv, or json.`);
          process.exit(1);
        }

        const result = await loadEnvVars(repoRoot, envName, password);
        const formatted = formatEnvResult(result, format);

        console.log(formatted.message);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
