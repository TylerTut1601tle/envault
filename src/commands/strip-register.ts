import { Command } from 'commander';
import { resolvePassword } from '../cli';
import { runStrip, formatStripResult } from './strip';

export function registerStripCommand(program: Command): void {
  program
    .command('strip <vault> <keys...>')
    .description('Remove one or more keys from an encrypted vault')
    .option('-p, --password <password>', 'vault password')
    .option('--dry-run', 'preview without writing changes')
    .action(async (vault: string, keys: string[], opts: { password?: string; dryRun?: boolean }) => {
      const password = await resolvePassword(opts.password);
      const result = await runStrip({ vault, password, keys, dryRun: opts.dryRun });
      console.log(formatStripResult(result));
      if (!result.dryRun && result.stripped.length === 0) process.exit(1);
    });
}
