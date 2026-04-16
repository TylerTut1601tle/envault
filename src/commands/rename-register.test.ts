import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { Command } from 'commander';
import { registerRenameCommand } from './rename-register';
import { encryptEnvFile } from '../crypto/vault';

async function makeTempDir() {
  return mkdtemp(join(tmpdir(), 'envault-rename-reg-'));
}

describe('registerRenameCommand', () => {
  let dir: string;

  beforeEach(async () => {
    dir = await makeTempDir();
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('registers rename command on program', () => {
    const program = new Command();
    registerRenameCommand(program);
    const cmd = program.commands.find(c => c.name() === 'rename');
    expect(cmd).toBeDefined();
  });

  it('rename command has correct arguments', () => {
    const program = new Command();
    registerRenameCommand(program);
    const cmd = program.commands.find(c => c.name() === 'rename')!;
    expect(cmd.description()).toContain('Rename');
  });

  it('rename command accepts password option', () => {
    const program = new Command();
    registerRenameCommand(program);
    const cmd = program.commands.find(c => c.name() === 'rename')!;
    const opts = cmd.opts();
    expect(cmd.options.some(o => o.long === '--password')).toBe(true);
  });
});
