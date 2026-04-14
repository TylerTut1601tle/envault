import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { runDoctor, formatDoctorResult } from './doctor';
import { execSync } from 'child_process';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-doctor-'));
}

describe('runDoctor', () => {
  it('reports errors for a plain empty directory', async () => {
    const dir = makeTempDir();
    const result = await runDoctor(dir);
    const gitCheck = result.checks.find(c => c.name === 'git-repo');
    expect(gitCheck?.status).toBe('error');
    expect(result.allOk).toBe(false);
    fs.rmSync(dir, { recursive: true });
  });

  it('reports ok for git-repo when git is initialized', async () => {
    const dir = makeTempDir();
    execSync('git init', { cwd: dir });
    const result = await runDoctor(dir);
    const gitCheck = result.checks.find(c => c.name === 'git-repo');
    expect(gitCheck?.status).toBe('ok');
    fs.rmSync(dir, { recursive: true });
  });

  it('reports warn for envault-init when .envault is missing', async () => {
    const dir = makeTempDir();
    execSync('git init', { cwd: dir });
    const result = await runDoctor(dir);
    const initCheck = result.checks.find(c => c.name === 'envault-init');
    expect(initCheck?.status).toBe('warn');
    fs.rmSync(dir, { recursive: true });
  });

  it('reports ok for envault-init when .envault exists', async () => {
    const dir = makeTempDir();
    execSync('git init', { cwd: dir });
    fs.mkdirSync(path.join(dir, '.envault'), { recursive: true });
    const result = await runDoctor(dir);
    const initCheck = result.checks.find(c => c.name === 'envault-init');
    expect(initCheck?.status).toBe('ok');
    fs.rmSync(dir, { recursive: true });
  });

  it('reports warn when .env is not gitignored', async () => {
    const dir = makeTempDir();
    execSync('git init', { cwd: dir });
    const result = await runDoctor(dir);
    const ignoreCheck = result.checks.find(c => c.name === 'env-gitignored');
    expect(ignoreCheck?.status).toBe('warn');
    fs.rmSync(dir, { recursive: true });
  });

  it('reports ok when .env is in .gitignore', async () => {
    const dir = makeTempDir();
    execSync('git init', { cwd: dir });
    fs.writeFileSync(path.join(dir, '.gitignore'), '.env\n');
    const result = await runDoctor(dir);
    const ignoreCheck = result.checks.find(c => c.name === 'env-gitignored');
    expect(ignoreCheck?.status).toBe('ok');
    fs.rmSync(dir, { recursive: true });
  });
});

describe('formatDoctorResult', () => {
  it('includes check statuses in output', async () => {
    const dir = makeTempDir();
    const result = await runDoctor(dir);
    const output = formatDoctorResult(result);
    expect(output).toContain('envault doctor:');
    expect(output).toContain('[ERROR]');
    fs.rmSync(dir, { recursive: true });
  });

  it('shows all checks passed when allOk is true', () => {
    const output = formatDoctorResult({
      checks: [{ name: 'test', status: 'ok', message: 'Everything fine' }],
      allOk: true,
    });
    expect(output).toContain('All checks passed.');
  });
});
