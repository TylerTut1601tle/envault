import { Command } from 'commander';
import { resolve } from 'path';
import { decryptVaultFile, getVaultPath } from '../crypto/vault';
import { resolvePassword } from '../cli';
import { formatResolveResult } from './resolve';

/**
 * Registers the `resolve` command with the CLI program.
 *
 * The resolve command expands variable references (e.g. ${OTHER_VAR})
 * within a vault's env values, printing the fully-resolved output.
 */
export function registerResolveCommand(program: Command): void {
  program
    .command('resolve <vault>')
    .description('Resolve and expand variable references in a vault')
    .option('-p, --password <password>', 'encryption password')
    .option('--env-password <envVar>', 'environment variable containing the password', 'ENVAULT_PASSWORD')
    .option('--key <key>', 'resolve only a specific key')
    .option('--strict', 'fail if any referenced variable is undefined', false)
    .option('--json', 'output as JSON', false)
    .action(async (vault: string, options: {
      password?: string;
      envPassword: string;
      key?: string;
      strict: boolean;
      json: boolean;
    }) => {
      try {
        const password = await resolvePassword(options.password, options.envPassword);
        const vaultPath = getVaultPath(resolve(process.cwd(), vault));
        const envMap = await decryptVaultFile(vaultPath, password);

        const result = formatResolveResult(envMap, {
          key: options.key,
          strict: options.strict,
        });

        if (options.json) {
          console.log(JSON.stringify(result.resolved, null, 2));
        } else {
          if (result.errors.length > 0) {
            for (const err of result.errors) {
              console.error(`  warning: ${err}`);
            }
          }
          for (const [k, v] of Object.entries(result.resolved)) {
            console.log(`${k}=${v}`);
          }
        }

        if (options.strict && result.errors.length > 0) {
          process.exit(1);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(`Error: ${message}`);
        process.exit(1);
      }
    });
}
