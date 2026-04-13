import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Command } from 'commander';
import { registerTemplateCommand } from './template-register';
import { encryptEnvFile } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-tmplreg-test-'));
}

vi.mock('../cli', () => ({
  resolvePassword: async (p?: string) => p ?? 'mocked-password',
}));

describe('registerTemplateCommand', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('registers the template command on the program', () => {
    const program = new Command();
    registerTemplateCommand(program);
    const cmd = program.commands.find((c) => c.name() === 'template');
    expect(cmd).toBeDefined();
  });

  it('template command has expected options', () => {
    const program = new Command();
    registerTemplateCommand(program);
    const cmd = program.commands.find((c) => c.name() === 'template')!;
    const optNames = cmd.options.map((o) => o.long);
    expect(optNames).toContain('--output');
    expect(optNames).toContain('--password');
    expect(optNames).toContain('--env-file');
  });

  it('renders template and writes output file via command', async () => {
    const password = 'mocked-password';
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'DB_HOST=localhost\n');
    await encryptEnvFile(envFile, password);

    const templateFile = path.join(tmpDir, 'db.tmpl');
    fs.writeFileSync(templateFile, 'host=${DB_HOST}');
    const outputFile = path.join(tmpDir, 'db.conf');

    const program = new Command();
    program.exitOverride();
    registerTemplateCommand(program);

    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    await program.parseAsync([
      'node', 'envault',
      'template', 'default', templateFile,
      '--output', outputFile,
      '--password', password,
      '--env-file', envFile,
    ]);
    consoleSpy.mockRestore();

    expect(fs.existsSync(outputFile)).toBe(true);
    expect(fs.readFileSync(outputFile, 'utf-8')).toBe('host=localhost');
  });
});
