import type { Argv } from 'yargs';
import { runChangelog, formatChangelogResult, readChangelog } from './changelog';
import { getRepoRoot } from '../git/secrets';

export function registerChangelogCommand(yargs: Argv): Argv {
  return yargs.command(
    'changelog [vault]',
    'Show history of actions performed on vaults',
    (y) =>
      y
        .positional('vault', {
          type: 'string',
          description: 'Filter changelog by vault name',
        })
        .option('json', {
          type: 'boolean',
          default: false,
          description: 'Output raw JSON',
        }),
    async (argv) => {
      try {
        const cwd = process.cwd();
        const repoRoot = await getRepoRoot(cwd);
        const entries = readChangelog(repoRoot);
        if (argv.json) {
          const filtered = argv.vault ? entries.filter(e => e.vault === argv.vault) : entries;
          console.log(JSON.stringify(filtered, null, 2));
        } else {
          const output = formatChangelogResult(entries, argv.vault as string | undefined);
          console.log(output);
        }
      } catch (err: any) {
        console.error('changelog error:', err.message);
        process.exit(1);
      }
    }
  );
}
