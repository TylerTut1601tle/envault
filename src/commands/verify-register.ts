import type { Command } from 'commander';
import { resolvePassword } from '../cli';
import { runVerify, formatVerifyResult } from './verify';

export function registerVerifyCommand(program: Command): void {
  program
    .command('verify <env>')
    .description('Verify that a vault file can be decrypted with the given password')
    .option('-p, --password <password>', 'Encryption password')
    .option('--env-password <envVar>', 'Environment variable containing the password', 'ENVAULT_PASSWORD')
    .action(async (env: string, opts: { password?: string; envPassword?: string }) => {
      const password = resolvePassword(opts.password, opts.envPassword);

      if (!password) {
        console.error('Error: A password is required. Use --password or set ENVAULT_PASSWORD.');
        process.exit(1);
      }

      const result = await runVerify(env, password);
      console.log(formatVerifyResult(result));

      if (!result.valid) {
        process.exit(1);
      }
    });
}
