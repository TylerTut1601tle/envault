import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';
import { decryptVaultFile, getVaultPath } from '../crypto/vault';
import { resolvePassword } from '../cli';
import { formatSampleResult } from './sample';

/**
 * Registers the `sample` command with the CLI program.
 *
 * The sample command randomly selects N key-value pairs from a vault file
 * and outputs them, useful for testing or generating example configs.
 */
export function registerSampleCommand(program: Command): void {
  program
    .command('sample <vault>')
    .description('Randomly sample N entries from a vault')
    .option('-n, --count <number>', 'number of entries to sample', '5')
    .option('-s, --seed <number>', 'random seed for reproducible sampling')
    .option('-k, --keys-only', 'output only the keys, not values')
    .option('-p, --password <password>', 'encryption password')
    .option('--env-file <path>', 'path to .env file instead of vault')
    .action(async (vault: string, options: {
      count: string;
      seed?: string;
      keysOnly?: boolean;
      password?: string;
      envFile?: string;
    }) => {
      try {
        const count = parseInt(options.count, 10);
        if (isNaN(count) || count < 1) {
          console.error('Error: --count must be a positive integer');
          process.exit(1);
        }

        const seed = options.seed !== undefined ? parseInt(options.seed, 10) : undefined;
        if (options.seed !== undefined && isNaN(seed!)) {
          console.error('Error: --seed must be an integer');
          process.exit(1);
        }

        let envContent: string;

        if (options.envFile) {
          const envPath = path.resolve(options.envFile);
          if (!fs.existsSync(envPath)) {
            console.error(`Error: env file not found: ${envPath}`);
            process.exit(1);
          }
          envContent = fs.readFileSync(envPath, 'utf-8');
        } else {
          const vaultPath = getVaultPath(vault);
          if (!fs.existsSync(vaultPath)) {
            console.error(`Error: vault not found: ${vaultPath}`);
            process.exit(1);
          }

          const password = await resolvePassword(options.password);
          envContent = await decryptVaultFile(vaultPath, password);
        }

        const result = formatSampleResult(envContent, count, {
          seed,
          keysOnly: options.keysOnly,
        });

        console.log(result);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
