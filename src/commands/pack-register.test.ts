import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import { registerPackCommand } from './pack-register';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-pack-reg-'));
}

describe('registerPackCommand', () => {
  it('registers the pack command on the program', () => {
    const program = new Command();
    registerPackCommand(program);
    const cmd = program.commands.find(c => c.name() === 'pack');
    expect(cmd).toBeDefined();
  });

  it('pack command has expected description', () => {
    const program = new Command();
    registerPackCommand(program);
    const cmd = program.commands.find(c => c.name() === 'pack');
    expect(cmd?.description()).toContain('Bundle');
  });

  it('pack command accepts --password and --dir options', () => {
    const program = new Command();
    registerPackCommand(program);
    const cmd = program.commands.find(c => c.name() === 'pack')!;
    const optNames = cmd.options.map(o => o.long);
    expect(optNames).toContain('--password');
    expect(optNames).toContain('--dir');
  });
});
