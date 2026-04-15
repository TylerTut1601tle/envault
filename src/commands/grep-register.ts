import { Command } from 'commander';
import { resolvePassword } from '../cli';
import { listTrackedVaults } from '../git/secrets';
import { grepVaults, formatGrepResult } from './grep';

export function registerGrepCommand(program: Command, cwd: () => string): void {
  program
    .command('grep <pattern>')
    .description('Search for keys (or values) matching a pattern across vaults')
    .option('-v, --values', 'Also search in values (hidden by default)', false)
    .option('--show-values', 'Display matched values in output', false)
    .option('--vault <name>', 'Restrict search to a specific vault')
    .option('-p, --password <password>', 'Encryption password')
    .action(async (pattern: string, opts) => {
      const dir = cwd();
      const password = await resolvePassword(opts.password);

      let vaultNames: string[];
      if (opts.vault) {
        vaultNames = [opts.vault];
      } else {
        vaultNames = await listTrackedVaults(dir);
        if (vaultNames.length === 0) {
          console.log('No tracked vaults found.');
          return;
        }
      }

      const result = await grepVaults(pattern, vaultNames, password, dir, opts.values);
      console.log(formatGrepResult(result, opts.showValues));

      if (result.error) process.exit(1);
    });
}
