import { Command } from 'commander';
import * as path from 'path';
import { addTags, removeTags, readTags, listByTag, formatTagResult } from './tag';

export function registerTagCommand(program: Command): void {
  const tag = program
    .command('tag <vault>')
    .description('Add, remove, or list tags for a vault')
    .option('--add <tags...>', 'Tags to add')
    .option('--remove <tags...>', 'Tags to remove')
    .option('--list-by <tag>', 'List vaults with a specific tag')
    .option('--dir <dir>', 'Working directory', process.cwd())
    .action((vault: string, opts) => {
      const dir = path.resolve(opts.dir);

      if (opts.listBy) {
        const vaults = listByTag(dir, opts.listBy);
        if (vaults.length === 0) {
          console.log(`No vaults tagged with "${opts.listBy}"`);
        } else {
          console.log(`Vaults tagged "${opts.listBy}":\n${vaults.map(v => `  - ${v}`).join('\n')}`);
        }
        return;
      }

      if (opts.add) {
        const result = addTags(dir, vault, opts.add);
        console.log(formatTagResult(result));
        return;
      }

      if (opts.remove) {
        const result = removeTags(dir, vault, opts.remove);
        console.log(formatTagResult(result));
        return;
      }

      // Default: show current tags
      const all = readTags(dir);
      const tags = all[vault] ?? [];
      console.log(`Tags for ${vault}: ${tags.length ? tags.join(', ') : '(none)'}`);
    });
}
