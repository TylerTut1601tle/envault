import { Command } from 'commander';
import { resolvePassword } from '../cli';
import { getRepoRoot } from '../git/secrets';
import { formatTruncateResult, runTruncate } from './truncate';

export function registerTruncateCommand(program: Command): void {
  program
    .command('truncate <file>')
    .description('Keep only the first N keys in a vault, removing the rest')
    .requiredOption('-k, --keep <n>', 'Number of keys to keep', parseInt)
    .option('-p, --password <password>', 'Encryption password')
    .action(async (file: string, opts: { keep: number; password?: string }) => {
      try {
        const password = await resolvePassword(opts.password);
        const repoRoot = await getRepoRoot();
        const result = await runTruncate({ file, keep: opts.keep, password, repoRoot });
        console.log(formatTruncateResult(result));
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
