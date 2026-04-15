import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import { registerGrepCommand } from './grep-register';
import { encryptEnvFile, getVaultPath } from '../crypto/vault';
import * as fsp from 'fs/promises';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-grep-reg-'));
}

const PASSWORD = 'test-password';

async function setup(dir: string) {
  await fsp.mkdir(path.join(dir, '.envault'), { recursive: true });
  const vaultPath = getVaultPath(dir, 'dev');
  await encryptEnvFile('DB_URL=postgres://localhost\nAPI_KEY=abc123\n', vaultPath, PASSWORD);
  // write tracked list
  await fsp.writeFile(path.join(dir, '.envault', 'vaults.json'), JSON.stringify(['dev']));
}

function makeProgram(dir: string): Command {
  const program = new Command();
  program.exitOverride();
  registerGrepCommand(program, () => dir);
  return program;
}

test('grep command registers without error', () => {
  const dir = makeTempDir();
  const program = makeProgram(dir);
  const cmd = program.commands.find(c => c.name() === 'grep');
  expect(cmd).toBeDefined();
});

test('grep command has expected options', () => {
  const dir = makeTempDir();
  const program = makeProgram(dir);
  const cmd = program.commands.find(c => c.name() === 'grep')!;
  const optNames = cmd.options.map(o => o.long);
  expect(optNames).toContain('--values');
  expect(optNames).toContain('--show-values');
  expect(optNames).toContain('--vault');
  expect(optNames).toContain('--password');
});
