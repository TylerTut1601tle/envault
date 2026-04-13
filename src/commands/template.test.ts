import fs from 'fs';
import os from 'os';
import path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderTemplate, runTemplate } from './template';
import { encryptEnvFile } from '../crypto/vault';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-template-test-'));
}

describe('renderTemplate', () => {
  it('replaces ${VAR} placeholders', () => {
    const result = renderTemplate('Hello ${NAME}!', { NAME: 'World' });
    expect(result).toBe('Hello World!');
  });

  it('replaces $VAR placeholders', () => {
    const result = renderTemplate('Port: $PORT', { PORT: '3000' });
    expect(result).toBe('Port: 3000');
  });

  it('leaves unknown variables unchanged', () => {
    const result = renderTemplate('${UNKNOWN}', {});
    expect(result).toBe('${UNKNOWN}');
  });

  it('handles multiple variables', () => {
    const result = renderTemplate('${A} and ${B}', { A: 'foo', B: 'bar' });
    expect(result).toBe('foo and bar');
  });
});

describe('runTemplate', () => {
  let tmpDir: string;
  const password = 'test-password-123';

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('returns error if vault not found', async () => {
    const templateFile = path.join(tmpDir, 'tmpl.txt');
    fs.writeFileSync(templateFile, 'hello');
    const result = await runTemplate({
      vault: 'missing',
      templateFile,
      password,
      envFile: path.join(tmpDir, '.env'),
    });
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/vault not found/i);
  });

  it('returns error if template file not found', async () => {
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'KEY=val\n');
    await encryptEnvFile(envFile, password);
    const result = await runTemplate({
      vault: 'default',
      templateFile: path.join(tmpDir, 'missing.txt'),
      password,
      envFile,
    });
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/template file not found/i);
  });

  it('renders template to stdout (no output file)', async () => {
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'APP_NAME=envault\n');
    await encryptEnvFile(envFile, password);
    const templateFile = path.join(tmpDir, 'config.tmpl');
    fs.writeFileSync(templateFile, 'App: ${APP_NAME}');
    const result = await runTemplate({
      vault: 'default',
      templateFile,
      password,
      envFile,
    });
    expect(result.success).toBe(true);
    expect(result.rendered).toBe('App: envault');
  });

  it('writes rendered output to file when output specified', async () => {
    const envFile = path.join(tmpDir, '.env');
    fs.writeFileSync(envFile, 'PORT=8080\n');
    await encryptEnvFile(envFile, password);
    const templateFile = path.join(tmpDir, 'server.tmpl');
    fs.writeFileSync(templateFile, 'listen $PORT;');
    const outputFile = path.join(tmpDir, 'out', 'server.conf');
    const result = await runTemplate({
      vault: 'default',
      templateFile,
      password,
      output: outputFile,
      envFile,
    });
    expect(result.success).toBe(true);
    expect(fs.readFileSync(outputFile, 'utf-8')).toBe('listen 8080;');
  });
});
