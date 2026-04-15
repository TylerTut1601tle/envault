import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { registerCheckCommand } from './check-register';
import { encryptEnvFile } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-check-register-'));
}

describe('registerCheckCommand', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('registers the check command on a program', () => {
    const program = new Command();
    registerCheckCommand(program);
    const cmd = program.commands.find((c) => c.name() === 'check');
    expect(cmd).toBeDefined();
  });

  it('check command has expected options', () => {
    const program = new Command();
    registerCheckCommand(program);
    const cmd = program.commands.find((c) => c.name() === 'check');
    expect(cmd).toBeDefined();
    const optionNames = cmd!.options.map((o) => o.long);
    expect(optionNames).toContain('--password');
    expect(optionNames).toContain('--env-file');
    expect(optionNames).toContain('--json');
  });

  it('check command description is set', () => {
    const program = new Command();
    registerCheckCommand(program);
    const cmd = program.commands.find((c) => c.name() === 'check');
    expect(cmd!.description()).toMatch(/check/i);
  });

  it('check command accepts a vault argument', () => {
    const program = new Command();
    registerCheckCommand(program);
    const cmd = program.commands.find((c) => c.name() === 'check');
    const args = cmd!.registeredArguments;
    expect(args.length).toBeGreaterThanOrEqual(1);
    expect(args[0].name()).toBe('vault');
  });
});
