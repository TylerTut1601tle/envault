import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerWatchCommand } from './watch-register';
import { encryptEnvFile, getVaultPath } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-watch-reg-'));
}

describe('registerWatchCommand', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('registers the watch command on the program', () => {
    const program = new Command();
    registerWatchCommand(program, tmpDir);
    const cmd = program.commands.find(c => c.name() === 'watch');
    expect(cmd).toBeDefined();
    expect(cmd?.description()).toContain('Watch');
  });

  it('watch command has expected options', () => {
    const program = new Command();
    registerWatchCommand(program, tmpDir);
    const cmd = program.commands.find(c => c.name() === 'watch')!;
    const optionNames = cmd.options.map(o => o.long);
    expect(optionNames).toContain('--password');
    expect(optionNames).toContain('--env-password');
  });

  it('watch command accepts an env-file argument', () => {
    const program = new Command();
    registerWatchCommand(program, tmpDir);
    const cmd = program.commands.find(c => c.name() === 'watch')!;
    expect(cmd.registeredArguments.length).toBeGreaterThan(0);
    expect(cmd.registeredArguments[0].name()).toBe('env-file');
  });
});
