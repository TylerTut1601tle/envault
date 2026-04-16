import { Command } from 'commander';
import { formatTouchResult } from './touch';
import { resolvePassword } from '../cli';
import { getVaultPath } from '../crypto/vault';
import * as fs from 'fs';
import * as path from 'path';

export function registerTouchCommand(program: Command): void {
  program
    .command('touch <env>')
    .description('Create an empty vault file for the given environment')
    .option('-p, --password <password>', 'encryption password')
    .option('-d, --dir <dir>', 'vault directory', '.envault')
    .action(async (env: string, opts: { password?: string; dir?: string }) => {
      const cwd = process.cwd();
      const password = await resolvePassword(opts.password);
      const vaultDir = path.resolve(cwd, opts.dir ?? '.envault');
      const vaultPath = getVaultPath(vaultDir, env);

      const result = await (async () => {
        const { runTouch } = await import('./touch');
        return runTouch({ env, vaultPath, password, cwd });
      })();

      console.log(formatTouchResult(result));
      if (!result.success) process.exit(1);
    });
}
