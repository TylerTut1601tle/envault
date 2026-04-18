import { Command } from 'commander';
import { runMv, formatMvResult } from './mv';
import { resolvePassword } from '../cli';

export function registerMvCommand(program: Command): void {
  program
    .command('mv <from> <to>')
    .description('Move (rename) a vault file')
    .option('-d, --dir <dir>', 'working directory', process.cwd())
    .action(async (from: string, to: string, opts: { dir: string }) => {
      const result = await runMv(opts.dir, from, to);
      console.log(formatMvResult(result));
      if (!result.success) process.exit(1);
    });
}
