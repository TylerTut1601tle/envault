import { Command } from 'commander';
import { resolvePassword } from '../cli';
import { runMask, formatMaskResult } from './mask';

export function registerMaskCommand(program: Command): void {
  program
    .command('mask <file>')
    .description('Display env values with masked/redacted output')
    .option('-p, --password <password>', 'encryption password')
    .option('-s, --show <n>', 'number of trailing characters to reveal', '0')
    .option('-c, --char <char>', 'masking character', '*')
    .option('-k, --keys <keys>', 'comma-separated list of keys to mask (default: all)')
    .action(async (file: string, opts) => {
      try {
        const password = await resolvePassword(opts.password);
        const show = parseInt(opts.show ?? '0', 10);
        const char = opts.char ?? '*';
        const keys = opts.keys ? (opts.keys as string).split(',').map((k: string) => k.trim()) : undefined;
        const result = await runMask(file, password, { show, char, keys });
        console.log(formatMaskResult(result));
      } catch (err: unknown) {
        console.error('mask failed:', err instanceof Error ? err.message : String(err));
        process.exit(1);
      }
    });
}
