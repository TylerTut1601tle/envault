import { Command } from 'commander';
import { resolvePassword } from '../cli';
import { listVaultKeys, formatKeysResult } from './keys';
import * as process from 'process';

export function registerKeysCommand(program: Command): void {
  program
    .command('keys <vault>')
    .description('List all keys stored in an encrypted vault')
    .option('-p, --password <password>', 'Encryption password')
    .option('--env-pass <envVar>', 'Environment variable holding the password')
    .action(async (vault: string, opts: { password?: string; envPass?: string }) => {
      try {
        const password = await resolvePassword(opts.password, opts.envPass);
        const result = await listVaultKeys(process.cwd(), vault, password);
        console.log(formatKeysResult(result));
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
