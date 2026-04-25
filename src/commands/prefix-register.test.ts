import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import { registerPrefixCommand } from './prefix-register';
import { encryptEnvFile, decryptVaultFile, getVaultPath } from '../crypto/vault';

async function makeTempDir(): Promise<string> {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-prefix-reg-'));
}

function makeProgram(): Command {
  const program = new Command();
  program.exitOverride();
  registerPrefixCommand(program);
  return program;
}

const PASSWORD = 'test-password';

describe('registerPrefixCommand', () => {
  it('registers prefix command on program', () => {
    const program = makeProgram();
    const cmd = program.commands.find((c) => c.name() === 'prefix');
    expect(cmd).toBeDefined();
  });

  it('command has expected options', () => {
    const program = makeProgram();
    const cmd = program.commands.find((c) => c.name() === 'prefix')!;
    const optNames = cmd.options.map((o) => o.long);
    expect(optNames).toContain('--vault-dir');
    expect(optNames).toContain('--dry-run');
    expect(optNames).toContain('--overwrite');
  });

  it('command description mentions prefix', () => {
    const program = makeProgram();
    const cmd = program.commands.find((c) => c.name() === 'prefix')!;
    expect(cmd.description()).toMatch(/prefix/i);
  });
});
