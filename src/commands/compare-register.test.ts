import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { Command } from 'commander';
import { registerCompareCommand } from './compare-register';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-compare-reg-'));
}

describe('registerCompareCommand', () => {
  let tmpDir: string;

  beforeEach(() => { tmpDir = makeTempDir(); });
  afterEach(() => { fs.rmSync(tmpDir, { recursive: true }); });

  it('registers the compare command on the program', () => {
    const program = new Command();
    registerCompareCommand(program);
    const names = program.commands.map(c => c.name());
    expect(names).toContain('compare');
  });

  it('compare command has correct arguments and options', () => {
    const program = new Command();
    registerCompareCommand(program);
    const cmd = program.commands.find(c => c.name() === 'compare')!;
    expect(cmd).toBeDefined();
    const optNames = cmd.options.map(o => o.long);
    expect(optNames).toContain('--password');
    expect(optNames).toContain('--show-same');
  });
});
