import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { generateTemplate, formatTemplateResult } from './template';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-template-test-'));
}

describe('generateTemplate', () => {
  it('creates a template file stripping all values', async () => {
    const dir = makeTempDir();
    const envPath = path.join(dir, '.env');
    fs.writeFileSync(
      envPath,
      '# App config\nAPI_KEY=supersecret\nDB_URL=postgres://localhost/db\nDEBUG=true\n'
    );

    const result = await generateTemplate(dir);

    expect(result.skipped).toBe(false);
    expect(result.keyCount).toBe(3);
    expect(fs.existsSync(result.templatePath)).toBe(true);

    const content = fs.readFileSync(result.templatePath, 'utf-8');
    expect(content).toContain('API_KEY=');
    expect(content).not.toContain('supersecret');
    expect(content).toContain('DB_URL=');
    expect(content).not.toContain('postgres');
    expect(content).toContain('# App config');
  });

  it('skips generation if template already exists', async () => {
    const dir = makeTempDir();
    fs.writeFileSync(path.join(dir, '.env'), 'FOO=bar\n');
    const templatePath = path.join(dir, '.env.template');
    fs.writeFileSync(templatePath, 'FOO=\n');

    const result = await generateTemplate(dir);

    expect(result.skipped).toBe(true);
    expect(result.keyCount).toBe(0);
  });

  it('supports a custom output path', async () => {
    const dir = makeTempDir();
    fs.writeFileSync(path.join(dir, '.env'), 'SECRET=abc\n');
    const customOutput = path.join(dir, 'env.example');

    const result = await generateTemplate(dir, '.env', customOutput);

    expect(result.templatePath).toBe(customOutput);
    expect(fs.existsSync(customOutput)).toBe(true);
  });

  it('throws if no .env file exists', async () => {
    const dir = makeTempDir();
    await expect(generateTemplate(dir)).rejects.toThrow('No .env file found');
  });
});

describe('formatTemplateResult', () => {
  it('formats a successful result', () => {
    const output = formatTemplateResult({
      templatePath: '/project/.env.template',
      keyCount: 5,
      skipped: false,
    });
    expect(output).toContain('✅');
    expect(output).toContain('5 key(s)');
    expect(output).toContain('.env.template');
  });

  it('formats a skipped result', () => {
    const output = formatTemplateResult({
      templatePath: '/project/.env.template',
      keyCount: 0,
      skipped: true,
    });
    expect(output).toContain('⚠️');
    expect(output).toContain('skipped');
  });
});
