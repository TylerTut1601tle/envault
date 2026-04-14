import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Command } from 'commander';
import { registerLintCommand } from './lint-register';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-lint-reg-'));
}

describe('registerLintCommand', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTempDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true }); });

  it('registers the lint command on a Commander program', () => {
    const program = new Command();
    registerLintCommand(program);
    const cmd = program.commands.find(c => c.name() === 'lint');
    expect(cmd).toBeDefined();
  });

  it('lint command has expected options', () => {
    const program = new Command();
    registerLintCommand(program);
    const cmd = program.commands.find(c => c.name() === 'lint')!;
    const optNames = cmd.options.map(o => o.long);
    expect(optNames).toContain('--password');
    expect(optNames).toContain('--fail-on-warnings');
  });

  it('lint command accepts a file argument', () => {
    const program = new Command();
    registerLintCommand(program);
    const cmd = program.commands.find(c => c.name() === 'lint')!;
    expect(cmd.registeredArguments.length).toBeGreaterThan(0);
    expect(cmd.registeredArguments[0].name()).toBe('file');
  });
});
