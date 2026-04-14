import type { Command } from 'commander';
import { runLint, formatLintResult } from './lint';
import { resolvePassword } from '../cli';

export function registerLintCommand(program: Command): void {
  program
    .command('lint <file>')
    .description('Lint a .env or vault file for common issues (duplicates, invalid keys, empty values)')
    .option('-p, --password <password>', 'Password for encrypted vault files')
    .option('--fail-on-warnings', 'Exit with non-zero code on warnings as well as errors')
    .action(async (file: string, opts: { password?: string; failOnWarnings?: boolean }) => {
      try {
        const password = await resolvePassword(opts.password);
        const result = await runLint(file, password);
        console.log(formatLintResult(result));

        const hasErrors = result.issues.some(i => i.severity === 'error');
        const hasWarnings = result.issues.some(i => i.severity === 'warning');

        if (hasErrors || (opts.failOnWarnings && hasWarnings)) {
          process.exit(1);
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
