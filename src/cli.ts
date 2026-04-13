#!/usr/bin/env node
import { Command } from 'commander';
import { runLock } from './commands/lock';
import { runUnlock } from './commands/unlock';
import { runStatus } from './commands/status';
import { runList } from './commands/list';
import { runRotate } from './commands/rotate';
import { runAdd } from './commands/add';
import { runInit } from './commands/init';
import { pullVaults, formatPullResult } from './commands/pull';

const program = new Command();

program
  .name('envault')
  .description('Manage and encrypt local .env files with team-sharing support')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize envault in the current repository')
  .action(async () => runInit(process.cwd()));

program
  .command('lock')
  .description('Encrypt .env files into vault files')
  .option('-p, --passphrase <passphrase>', 'Passphrase for encryption', process.env.ENVAULT_PASSPHRASE)
  .action(async (opts) => runLock(opts.passphrase, process.cwd()));

program
  .command('unlock')
  .description('Decrypt vault files into .env files')
  .option('-p, --passphrase <passphrase>', 'Passphrase for decryption', process.env.ENVAULT_PASSPHRASE)
  .action(async (opts) => runUnlock(opts.passphrase, process.cwd()));

program
  .command('pull')
  .description('Pull and decrypt all tracked vault files from the repository')
  .option('-p, --passphrase <passphrase>', 'Passphrase for decryption', process.env.ENVAULT_PASSPHRASE)
  .action(async (opts) => {
    if (!opts.passphrase) {
      console.error('Error: passphrase is required. Use --passphrase or set ENVAULT_PASSPHRASE.');
      process.exit(1);
    }
    const result = await pullVaults(opts.passphrase, process.cwd());
    console.log(formatPullResult(result));
    if (result.errors.length > 0) process.exit(1);
  });

program
  .command('status')
  .description('Show status of .env and vault files')
  .action(async () => runStatus(process.cwd()));

program
  .command('list')
  .description('List all tracked vault files')
  .action(async () => runList(process.cwd()));

program
  .command('rotate')
  .description('Re-encrypt vault files with a new passphrase')
  .option('-p, --passphrase <passphrase>', 'Current passphrase', process.env.ENVAULT_PASSPHRASE)
  .option('-n, --new-passphrase <newPassphrase>', 'New passphrase')
  .action(async (opts) => runRotate(opts.passphrase, opts.newPassphrase, process.cwd()));

program
  .command('add <file>')
  .description('Add a new .env file to be tracked by envault')
  .option('-p, --passphrase <passphrase>', 'Passphrase for encryption', process.env.ENVAULT_PASSPHRASE)
  .action(async (file, opts) => runAdd(file, opts.passphrase, process.cwd()));

program.parse(process.argv);
