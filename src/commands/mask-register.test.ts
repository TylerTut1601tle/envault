import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerMaskCommand } from './mask-register';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-mask-reg-test-'));
}

describe('registerMaskCommand', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('registers the mask command on the program', () => {
    const program = new Command();
    registerMaskCommand(program);
    const names = program.commands.map(c => c.name());
    expect(names).toContain('mask');
  });

  it('mask command has expected options', () => {
    const program = new Command();
    registerMaskCommand(program);
    const maskCmd = program.commands.find(c => c.name() === 'mask')!;
    const optionNames = maskCmd.options.map(o => o.long);
    expect(optionNames).toContain('--password');
    expect(optionNames).toContain('--show');
    expect(optionNames).toContain('--char');
    expect(optionNames).toContain('--keys');
  });
});
