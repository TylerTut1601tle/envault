import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerTouchCommand } from './touch-register';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-touch-register-'));
}

describe('registerTouchCommand', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('registers the touch command on the program', () => {
    const program = new Command();
    registerTouchCommand(program);
    const cmd = program.commands.find((c) => c.name() === 'touch');
    expect(cmd).toBeDefined();
  });

  it('touch command has correct description', () => {
    const program = new Command();
    registerTouchCommand(program);
    const cmd = program.commands.find((c) => c.name() === 'touch');
    expect(cmd?.description()).toMatch(/empty vault/i);
  });

  it('touch command accepts env argument', () => {
    const program = new Command();
    registerTouchCommand(program);
    const cmd = program.commands.find((c) => c.name() === 'touch');
    const args = cmd?.registeredArguments ?? [];
    expect(args.some((a) => a.name() === 'env')).toBe(true);
  });
});
