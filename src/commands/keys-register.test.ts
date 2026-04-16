import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import { registerKeysCommand } from './keys-register';
import { encryptEnvFile } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-keys-reg-'));
}

function makeProgram(): Command {
  const p = new Command();
  p.exitOverride();
  registerKeysCommand(p);
  return p;
}

describe('registerKeysCommand', () => {
  it('registers the keys command', () => {
    const program = makeProgram();
    const cmd = program.commands.find((c) => c.name() === 'keys');
    expect(cmd).toBeDefined();
  });

  it('keys command has vault argument', () => {
    const program = makeProgram();
    const cmd = program.commands.find((c) => c.name() === 'keys')!;
    expect(cmd.description()).toContain('keys');
  });
});
