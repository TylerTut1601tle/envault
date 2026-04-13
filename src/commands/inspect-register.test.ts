import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';
import { registerInspectCommand } from './inspect-register';
import { encryptEnvFile } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-inspect-reg-'));
}

describe('registerInspectCommand', () => {
  let tmpDir: string;
  const password = 'reg-test-pass';

  beforeEach(() => {
    tmpDir = makeTempDir();
    process.chdir(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('registers the inspect command on the program', () => {
    const program = new Command();
    registerInspectCommand(program);
    const cmd = program.commands.find((c) => c.name() === 'inspect');
    expect(cmd).toBeDefined();
    expect(cmd?.description()).toContain('metadata');
  });

  it('prints inspect output for a valid vault', async () => {
    const envContent = 'SECRET=abc\nPORT=3000\n';
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, envContent);
    await encryptEnvFile(envFile, password);

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    process.env.ENVAULT_PASSWORD = password;

    const program = new Command();
    registerInspectCommand(program);
    await program.parseAsync(['node', 'envault', 'inspect', '.env']);

    const output = consoleSpy.mock.calls.map((c) => c[0]).join('\n');
    expect(output).toContain('Keys (2):');
    expect(output).toContain('  - SECRET');
    expect(output).toContain('  - PORT');

    delete process.env.ENVAULT_PASSWORD;
  });
});
