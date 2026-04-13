import { Command } from 'commander';
import { readChangelog, appendChangelogEntry, formatChangelogResult } from './changelog';
import { resolvePassword } from '../cli';

export function registerChangelogCommand(program: Command): void {
  const changelog = program
    .command('changelog')
    .description('View or append to the changelog for a vault');

  changelog
    .command('view <vault>')
    .description('View the changelog for a vault')
    .option('-n, --limit <number>', 'Limit the number of entries shown', '20')
    .action(async (vault: string, opts: { limit: string }) => {
      try {
        const entries = await readChangelog(vault);
        const limit = parseInt(opts.limit, 10);
        const result = formatChangelogResult(entries.slice(-limit));
        console.log(result);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });

  changelog
    .command('add <vault> <message>')
    .description('Append an entry to the changelog for a vault')
    .option('-p, --password <password>', 'Vault password')
    .action(async (vault: string, message: string, opts: { password?: string }) => {
      try {
        const password = await resolvePassword(opts.password);
        const entry = await appendChangelogEntry(vault, message, password);
        console.log(`Changelog entry added: ${entry.timestamp} — ${entry.message}`);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}