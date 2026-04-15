import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import { registerFmtCommand } from './fmt-register';
import { encryptEnvFile, getVaultPath } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-fmt-register-'));
}

describe('registerFmtCommand', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
    fs.mkdirSync(path.join(tmpDir, '.envault'), { recursive: true });
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('registers fmt command on program', () => {
    const program = new Command();
    registerFmtCommand(program);
    const cmd = program.commands.find((c) => c.name() === 'fmt');
    expect(cmd).toBeDefined();
  });

  it('fmt command has --check option', () => {
    const program = new Command();
    registerFmtCommand(program);
    const cmd = program.commands.find((c) => c.name() === 'fmt')!;
    const checkOpt = cmd.options.find((o) => o.long === '--check');
    expect(checkOpt).toBeDefined();
  });

  it('fmt command has --sort option', () => {
    const program = new Command();
    registerFmtCommand(program);
    const cmd = program.commands.find((c) => c.name() === 'fmt')!;
    const sortOpt = cmd.options.find((o) => o.long === '--sort');
    expect(sortOpt).toBeDefined();
  });

  it('fmt command has --password option', () => {
    const program = new Command();
    registerFmtCommand(program);
    const cmd = program.commands.find((c) => c.name() === 'fmt')!;
    const passOpt = cmd.options.find((o) => o.long === '--password');
    expect(passOpt).toBeDefined();
  });

  it('fmt command description mentions format', () => {
    const program = new Command();
    registerFmtCommand(program);
    const cmd = program.commands.find((c) => c.name() === 'fmt')!;
    expect(cmd.description().toLowerCase()).toContain('format');
  });
});
