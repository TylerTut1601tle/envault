import { Command } from 'commander';
import { resolvePassword } from '../cli';
import { runPrefix, formatPrefixResult } from './prefix';

export function registerPrefixCommand(program: Command): void {
  program
    .command('prefix <envfile> <prefix>')
    .description('Add a prefix to all keys in a vault')
    .option('-d, --vault-dir <dir>', 'directory where vault files are stored')
    .option('--dry-run', 'preview changes without writing')
    .option('--overwrite', 'overwrite existing keys that conflict with new prefixed names')
    .action(async (envFile: string, prefix: string, opts) => {
      try {
        const password = await resolvePassword();
        const result = await runPrefix(envFile, {
          prefix,
          vaultDir: opts.vaultDir,
          dryRun: opts.dryRun,
          overwrite: opts.overwrite,
        }, password);
        console.log(formatPrefixResult(result, opts.dryRun));
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
