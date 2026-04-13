import type { Argv } from 'yargs';
import { resolvePassword } from '../cli';
import { runMerge, formatMergeResult } from './merge';

export function registerMergeCommand(yargs: Argv): Argv {
  return yargs.command(
    'merge <source> <target>',
    'Merge env variables from a source file into a target vault',
    (y) =>
      y
        .positional('source', {
          describe: 'Source .env or .vault file path',
          type: 'string',
          demandOption: true,
        })
        .positional('target', {
          describe: 'Target environment name (e.g. production)',
          type: 'string',
          demandOption: true,
        })
        .option('overwrite', {
          alias: 'o',
          type: 'boolean',
          default: false,
          describe: 'Overwrite existing keys in the target vault',
        })
        .option('password', {
          alias: 'p',
          type: 'string',
          describe: 'Encryption password',
        }),
    async (argv) => {
      try {
        const password = await resolvePassword(argv.password as string | undefined);
        const result = await runMerge(
          argv.source as string,
          argv.target as string,
          password,
          argv.overwrite as boolean
        formatMergeResult(result));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    }
  );
}
