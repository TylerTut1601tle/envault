import { Command } from 'commander';
import * as path from 'path';
import { resolvePassword } from '../cli';
import { getVaultPath } from '../crypto/vault';
import { validateVault, formatValidateResult } from './validate';

export function registerValidateCommand(program: Command): void {
  program
    .command('validate [env]')
    .description('Validate a vault against a schema .env file')
    .option('-s, --schema <path>', 'Path to schema .env file defining required keys')
    .option('-p, --password <password>', 'Encryption password')
    .option('--password-env <var>', 'Environment variable containing the password', 'ENVAULT_PASSWORD')
    .action(async (env: string = '.env', opts) => {
      try {
        const password = await resolvePassword(opts);
        const vaultPath = getVaultPath(env);
        const schemaPath = opts.schema ? path.resolve(opts.schema) : undefined;
        const result = await validateVault(vaultPath, password, schemaPath);
        console.log(formatValidateResult(result));
        if (!result.valid) {
          process.exit(1);
        }
      } catch (e: any) {
        console.error(`Error: ${e.message}`);
        process.exit(1);
      }
    });
}
