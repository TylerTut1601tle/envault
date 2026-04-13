import type { Command } from 'commander';
import { resolvePassword } from '../cli';
import { getRepoRoot } from '../git/secrets';
import { formatSearchResult, runSearch } from './search';

export function registerSearchCommand(program: Command): void {
  program
    .command('search <query>')
    .description('Search for a key (or value) across all tracked vaults')
    .option('-s, --show-values', 'Include values in search and output', false)
    .option('-p, --password <password>', 'Vault password')
    .action(async (query: string, options: { showValues: boolean; password?: string }) => {
      try {
        const repoRoot = await getRepoRoot(process.cwd());
        const password = await resolvePassword(options.password);
        const result = await runSearch(repoRoot, query, password, options.showValues);
        console.log(formatSearchResult(result, options.showValues));
        if (result.error) {
          process.exit(1);
        }
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
