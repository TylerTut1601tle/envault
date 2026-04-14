import type { Command } from 'commander';
import { resolvePassword } from '../cli';
import { getRepoRoot } from '../git/secrets';
import { runCompare, formatCompareResult } from './compare';

export function registerCompareCommand(program: Command): void {
  program
    .command('compare <envA> <envB>')
    .description('Compare two encrypted vault files side by side')
    .option('-p, --password <password>', 'encryption password')
    .option('--show-same', 'also list keys with identical values')
    .action(async (envA: string, envB: string, opts: { password?: string; showSame?: boolean }) => {
      try {
        const password = await resolvePassword(opts.password);
        const repoRoot = await getRepoRoot();
        const result = await runCompare(envA, envB, password, repoRoot);

        if (!opts.showSame) {
          result.same = [];
        }

        console.log(formatCompareResult(result, envA, envB));
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
