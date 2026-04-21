import { Command } from 'commander';
import { resolvePassword } from '../cli';
import { summarizeVault, formatSummarizeResult } from './summarize';

export function registerSummarizeCommand(program: Command): void {
  program
    .command('summarize <envfile>')
    .description('Show a statistical summary of a vault file')
    .option('-p, --password <password>', 'Encryption password')
    .option('-d, --dir <dir>', 'Working directory', process.cwd())
    .action(async (envfile: string, opts: { password?: string; dir: string }) => {
      try {
        const password = await resolvePassword(opts.password);
        const result = await summarizeVault(envfile, password, opts.dir);
        console.log(formatSummarizeResult(result));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    });
}
