import type { Command } from 'commander';
import { resolvePassword } from '../cli';
import { formatWatchResult, runWatch } from './watch';

export function registerWatchCommand(program: Command, cwd: string): void {
  program
    .command('watch <env-file>')
    .description('Watch a vault file and print changes as they occur')
    .option('-p, --password <password>', 'Encryption password')
    .option('--env-password <var>', 'Env var holding the password', 'ENVAULT_PASSWORD')
    .action(async (envFile: string, opts: { password?: string; envPassword?: string }) => {
      const password = resolvePassword(opts.password, opts.envPassword ?? 'ENVAULT_PASSWORD');
      if (!password) {
        console.error('Error: password is required (use --password or ENVAULT_PASSWORD)');
        process.exit(1);
      }

      console.log(`Watching ${envFile} for changes... (Ctrl+C to stop)`);

      const stop = await runWatch(envFile, password, cwd, (result) => {
        console.log(formatWatchResult(result));
      });

      process.on('SIGINT', () => {
        stop();
        console.log('\nStopped watching.');
        process.exit(0);
      });
    });
}
