import { Command } from 'commander';
import { resolvePassword } from '../cli';
import { formatShareResult, runShare } from './share';

export function registerShareCommand(program: Command): void {
  program
    .command('share <vault>')
    .description('Decrypt a vault and export it as a shareable plain .env file')
    .option('-p, --password <password>', 'Encryption password')
    .option('-o, --output <path>', 'Output file path (default: <vault>.shared.env)')
    .option('--dir <dir>', 'Working directory', process.cwd())
    .action(async (vault: string, opts: { password?: string; output?: string; dir: string }) => {
      const password = await resolvePassword(opts.password);
      const result = await runShare(opts.dir, vault, password, opts.output);
      console.log(formatShareResult(result));
      if (!result.success) process.exit(1);
    });
}
