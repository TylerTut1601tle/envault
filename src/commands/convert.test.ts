import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { convertEnvFile, formatConvertResult } from './convert';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-convert-'));
}

const SAMPLE_ENV = 'FOO=bar\nBAZ=hello world\n# a comment\nQUOTED="value with spaces"\n';

describe('convertEnvFile', () => {
  let dir: string;

  beforeEach(() => { dir = makeTempDir(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('converts to json', async () => {
    const inp = path.join(dir, '.env');
    const out = path.join(dir, 'out.json');
    fs.writeFileSync(inp, SAMPLE_ENV);
    const r = await convertEnvFile(inp, out, 'json');
    expect(r.success).toBe(true);
    expect(r.keyCount).toBe(3);
    const parsed = JSON.parse(fs.readFileSync(out, 'utf-8'));
    expect(parsed.FOO).toBe('bar');
    expect(parsed.BAZ).toBe('hello world');
  });

  it('converts to yaml', async () => {
    const inp = path.join(dir, '.env');
    const out = path.join(dir, 'out.yaml');
    fs.writeFileSync(inp, SAMPLE_ENV);
    const r = await convertEnvFile(inp, out, 'yaml');
    expect(r.success).toBe(true);
    const content = fs.readFileSync(out, 'utf-8');
    expect(content).toContain('FOO: "bar"');
  });

  it('converts to export shell format', async () => {
    const inp = path.join(dir, '.env');
    const out = path.join(dir, 'out.sh');
    fs.writeFileSync(inp, SAMPLE_ENV);
    const r = await convertEnvFile(inp, out, 'export');
    expect(r.success).toBe(true);
    const content = fs.readFileSync(out, 'utf-8');
    expect(content).toContain('export FOO="bar"');
    expect(content).toContain('export BAZ="hello world"');
  });

  it('converts to dotenv (round-trip)', async () => {
    const inp = path.join(dir, '.env');
    const out = path.join(dir, '.env.out');
    fs.writeFileSync(inp, SAMPLE_ENV);
    const r = await convertEnvFile(inp, out, 'dotenv');
    expect(r.success).toBe(true);
    expect(fs.existsSync(out)).toBe(true);
  });

  it('returns error for missing file', async () => {
    const r = await convertEnvFile('/no/such/file.env', '/tmp/out.json', 'json');
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/not found/);
  });
});

describe('formatConvertResult', () => {
  it('formats success', () => {
    const msg = formatConvertResult({ success: true, inputPath: '.env', outputPath: 'out.json', format: 'json', keyCount: 5 });
    expect(msg).toContain('✓');
    expect(msg).toContain('5 key(s)');
    expect(msg).toContain('JSON');
  });

  it('formats failure', () => {
    const msg = formatConvertResult({ success: false, inputPath: '.env', outputPath: 'out.json', format: 'json', keyCount: 0, error: 'File not found' });
    expect(msg).toContain('✗');
    expect(msg).toContain('File not found');
  });
});
