import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { encryptEnvFile, getVaultPath } from '../crypto/vault';
import { registerValidateCommand } from './validate-register';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-validate-reg-'));
}

describe('registerValidateCommand', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('registers the validate command on the program', () => {
    const program = new Command();
    registerValidateCommand(program);
    const cmd = program.commands.find(c => c.name() === 'validate');
    expect(cmd).toBeDefined();
  });

  it('validate command has schema option', () => {
    const program = new Command();
    registerValidateCommand(program);
    const cmd = program.commands.find(c => c.name() === 'validate')!;
    const schemaOpt = cmd.options.find(o => o.long === '--schema');
    expect(schemaOpt).toBeDefined();
  });

  it('validate command has password option', () => {
    const program = new Command();
    registerValidateCommand(program);
    const cmd = program.commands.find(c => c.name() === 'validate')!;
    const passOpt = cmd.options.find(o => o.long === '--password');
    expect(passOpt).toBeDefined();
  });
});
