import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { formatFmtResult } from './fmt';
import { resolvePassword } from '../cli';
import { decryptVaultFile, getVaultPath } from '../crypto/vault';
import { serializeEnvFile, parseEnvFile } from '../env/parser';
import { encryptEnvFile } from '../crypto/vault';

export function registerFmtCommand(program: Command): void {
  program
    .command('fmt [env]')
    .description('Format and normalize an encrypted .env vault file in-place')
    .option('-p, --password <password>', 'encryption password')
    .option('--check', 'check if file is already formatted without writing')
    .option('--sort', 'sort keys alphabetically')
    .action(async (env: string = '.env', options: { password?: string; check?: boolean; sort?: boolean }) => {
      const cwd = process.cwd();
      const vaultPath = getVaultPath(cwd, env);

      if (!fs.existsSync(vaultPath)) {
        console.error(`Vault not found: ${vaultPath}`);
        process.exit(1);
      }

      const password = await resolvePassword(options.password);

      try {
        const entries = await decryptVaultFile(vaultPath, password);
        const original = fs.readFileSync(vaultPath, 'utf-8');

        const result = formatFmtResult(entries, {
          sort: options.sort ?? false,
          check: options.check ?? false,
          vaultPath,
          password,
        });

        console.log(result.message);

        if (!options.check && result.changed) {
          await encryptEnvFile(vaultPath, entries, password);
        }

        if (options.check && result.changed) {
          process.exit(1);
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
