import { Command } from 'commander';
import { resolvePassword } from '../cli';
import { getVaultStat, formatStatResult } from './stat';
import * as path from 'path';

export function registerStatCommand(program: Command): void {
  program
    .command('stat <env>')
    .description('Show metadata and statistics for a vault')
    .option('-p, --password <password>', 'Encryption password')
    .option('-d, --dir <dir>', 'Working directory', process.cwd())
    .action(async (env: string, opts: { password?: string; dir: string }) => {
      try {
        const password = await resolvePassword(opts.password);
        const stat = await getVaultStat(opts.dir, env, password);
        console.log(formatStatResult(stat));
        if (!stat.exists) process.exit(1);
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
