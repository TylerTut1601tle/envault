import { Command } from 'commander';
import { resolvePassword } from '../cli';
import { runRestore, formatRestoreResult } from './restore';

export function registerRestoreCommand(program: Command): void {
  program
    .command('restore <vault> <snapshot-id>')
    .description('Restore a .env file from a previously taken snapshot')
    .option('-o, --output <path>', 'Output path for the restored .env file')
    .option('-p, --password <password>', 'Encryption password')
    .action(async (vault: string, snapshotId: string, options: { output?: string; password?: string }) => {
      try {
        const password = await resolvePassword(options.password);
        const result = await runRestore(vault, snapshotId, password, options.output);
        console.log(formatRestoreResult(result));
        if (!result.success) process.exit(1);
      } catch (err: any) {
        console.error(`✖ Error: ${err.message}`);
        process.exit(1);
      }
    });
}
