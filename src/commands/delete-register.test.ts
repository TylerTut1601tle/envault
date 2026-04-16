import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { Command } from 'commander';
import { registerDeleteCommand } from './delete-register';

async function makeTempDir() {
  return mkdtemp(join(tmpdir(), 'envault-delete-reg-'));
}

describe('registerDeleteCommand', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await makeTempDir();
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('registers delete command on program', () => {
    const program = new Command();
    registerDeleteCommand(program);
    const cmd = program.commands.find(c => c.name() === 'delete');
    expect(cmd).toBeDefined();
  });

  it('delete command has correct description', () => {
    const program = new Command();
    registerDeleteCommand(program);
    const cmd = program.commands.find(c => c.name() === 'delete')!;
    expect(cmd.description()).toContain('Delete');
  });

  it('delete command has --force option', () => {
    const program = new Command();
    registerDeleteCommand(program);
    const cmd = program.commands.find(c => c.name() === 'delete')!;
    expect(cmd.options.some(o => o.long === '--force')).toBe(true);
  });

  it('delete command has --password option', () => {
    const program = new Command();
    registerDeleteCommand(program);
    const cmd = program.commands.find(c => c.name() === 'delete')!;
    expect(cmd.options.some(o => o.long === '--password')).toBe(true);
  });
});
