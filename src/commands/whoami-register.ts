import type { Command } from 'commander';
import { runWhoami } from './whoami';

export function registerWhoamiCommand(program: Command): void {
  program
    .command('whoami')
    .description('Show current envault identity and configuration')
    .action(() => {
      try {
        const output = runWhoami(process.cwd());
        console.log(output);
      } catch (err: any) {
        console.error(`Error: ${err.message}`);
        process.exit(1);
      }
    });
}
