import type { Command } from 'commander';
import { resolvePassword } from '../cli';
import { runInspect, formatInspectResult } from './inspect';

export function registerInspectCommand(program: Command): void {
  program
    .command('inspect [env-file]')
    .description('Show metadata and key names stored in a vault without revealing values')
    .option('-p, --password <password>', 'encryption password')
    .action(async (envFile: string = '.env', options: { password?: string }) => {
      try {
        const password = await resolvePassword(options.password);
        const result = await runInspect(envFile, password);
        console.log(formatInspectResult(result));
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
