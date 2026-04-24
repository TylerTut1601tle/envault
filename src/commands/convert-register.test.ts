import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { Command } from 'commander';
import { registerConvertCommand } from './convert-register';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-convreg-'));
}

describe('registerConvertCommand', () => {
  let dir: string;

  beforeEach(() => { dir = makeTempDir(); });
  afterEach(() => { fs.rmSync(dir, { recursive: true, force: true }); });

  it('registers the convert command on a program', () => {
    const program = new Command();
    registerConvertCommand(program);
    const cmd = program.commands.find(c => c.name() === 'convert');
    expect(cmd).toBeDefined();
  });

  it('convert command has expected options', () => {
    const program = new Command();
    registerConvertCommand(program);
    const cmd = program.commands.find(c => c.name() === 'convert')!;
    const formatOpt = cmd.options.find(o => o.long === '--format');
    expect(formatOpt).toBeDefined();
  });

  it('runs convert via program and produces output file', async () => {
    const inp = path.join(dir, '.env');
    const out = path.join(dir, 'result.json');
    fs.writeFileSync(inp, 'KEY=value\nANOTHER=123\n');

    const program = new Command();
    program.exitOverride();
    registerConvertCommand(program);

    await program.parseAsync(['convert', inp, out, '--format', 'json'], { from: 'user' });
    expect(fs.existsSync(out)).toBe(true);
    const parsed = JSON.parse(fs.readFileSync(out, 'utf-8'));
    expect(parsed.KEY).toBe('value');
    expect(parsed.ANOTHER).toBe('123');
  });
});
