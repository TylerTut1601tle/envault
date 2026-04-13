import type { Argv } from 'yargs';
import { runClone, formatCloneResult } from './clone';
import { resolvePassword } from '../cli';

export function registerCloneCommand(yargs: Argv): Argv {
  return yargs.command(
    'clone <source> <destination>',
    'Clone an existing vault to a new vault file',
    (y) =>
      y
        .positional('source', {
          describe: 'Source .env file name',
          type: 'string',
          demandOption: true,
        })
        .positional('destination', {
          describe: 'Destination .env file name',
          type: 'string',
          demandOption: true,
        })
        .option('password', {
          alias: 'p',
          type: 'string',
          description: 'Encryption password',
        }),
    async (argv) => {
      const password = await resolvePassword(argv.password as string | undefined);
      const result = await runClone(
        argv.source as string,
        argv.destination as string,
        password
      );
      console.log(formatCloneResult(result));
      if (!result.success) process.exit(1);
    }
  );
}
