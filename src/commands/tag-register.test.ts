import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Command } from 'commander';
import { registerTagCommand } from './tag-register';
import { addTags, readTags } from './tag';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-tag-reg-test-'));
}

describe('registerTagCommand', () => {
  let dir: string;
  let program: Command;
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    dir = makeTempDir();
    program = new Command();
    program.exitOverride();
    registerTagCommand(program);
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
    consoleSpy.mockRestore();
  });

  it('adds tags via CLI', () => {
    program.parse(['tag', 'dev.env', '--add', 'dev', 'local', '--dir', dir], { from: 'user' });
    const tags = readTags(dir);
    expect(tags['dev.env']).toContain('dev');
    expect(tags['dev.env']).toContain('local');
  });

  it('removes tags via CLI', () => {
    addTags(dir, 'dev.env', ['dev', 'local']);
    program.parse(['tag', 'dev.env', '--remove', 'local', '--dir', dir], { from: 'user' });
    const tags = readTags(dir);
    expect(tags['dev.env']).not.toContain('local');
  });

  it('lists vaults by tag via CLI', () => {
    addTags(dir, 'dev.env', ['dev']);
    addTags(dir, 'prod.env', ['prod']);
    program.parse(['tag', 'dev.env', '--list-by', 'dev', '--dir', dir], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('dev.env'));
  });

  it('shows no vaults message when tag not found', () => {
    program.parse(['tag', 'dev.env', '--list-by', 'nonexistent', '--dir', dir], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No vaults tagged'));
  });

  it('shows current tags when no option given', () => {
    addTags(dir, 'dev.env', ['dev']);
    program.parse(['tag', 'dev.env', '--dir', dir], { from: 'user' });
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('dev'));
  });
});
