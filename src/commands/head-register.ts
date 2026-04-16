import { Command } from 'commander';
import { resolvePassword } from '../cli';
import { runHead, formatHeadResult } from './head';

export function registerHeadCommand(program: Command): void {
  program
    .command('head <envfile>')
    .description('Show the first N keys of a vault')
    .option('-n, --lines <number>', 'Number of lines to show', '10')
    .option('-p, --password <password>', 'Vault password')
    .action(async (envFile: string, opts) => {
      try {
        const password = await resolvePassword(opts.password);
        const lines = parseInt(opts.lines, 10);
        const result = await runHead(envFile, { lines, password });
        console.log(formatHeadResult(result, lines));
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
