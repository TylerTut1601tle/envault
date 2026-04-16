import { Command } from 'commander';
import { resolvePassword } from '../cli';
import { trimVault, formatTrimResult } from './trim';

export function registerTrimCommand(program: Command): void {
  program
    .command('trim <name>')
    .description('Remove empty or blank entries from a vault')
    .option('-p, --password <password>', 'Vault password')
    .action(async (name: string, opts: { password?: string }) => {
      try {
        const password = await resolvePassword(opts.password);
        const result = await trimVault(process.cwd(), name, password);
        console.log(formatTrimResult(result));
      } catch (err: any) {
        console.error('Error:', err.message);
        process.exit(1);
      }
    });
}
