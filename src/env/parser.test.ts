import { parseEnvFile, serializeEnvFile } from './parser';

describe('parseEnvFile', () => {
  it('parses simple key=value pairs', () => {
    const input = 'FOO=bar\nBAZ=qux';
    expect(parseEnvFile(input)).toEqual({ FOO: 'bar', BAZ: 'qux' });
  });

  it('ignores blank lines and comments', () => {
    const input = '\n# This is a comment\nKEY=value\n';
    expect(parseEnvFile(input)).toEqual({ KEY: 'value' });
  });

  it('handles double-quoted values', () => {
    const input = 'MSG="hello world"';
    expect(parseEnvFile(input)).toEqual({ MSG: 'hello world' });
  });

  it('handles single-quoted values', () => {
    const input = "MSG='hello world'";
    expect(parseEnvFile(input)).toEqual({ MSG: 'hello world' });
  });

  it('strips inline comments', () => {
    const input = 'KEY=value # this is a comment';
    expect(parseEnvFile(input)).toEqual({ KEY: 'value' });
  });

  it('handles export prefix', () => {
    const input = 'export API_KEY=secret123';
    expect(parseEnvFile(input)).toEqual({ API_KEY: 'secret123' });
  });

  it('handles empty values', () => {
    const input = 'EMPTY=';
    expect(parseEnvFile(input)).toEqual({ EMPTY: '' });
  });

  it('handles values with equals signs', () => {
    const input = 'TOKEN=abc=def=ghi';
    expect(parseEnvFile(input)).toEqual({ TOKEN: 'abc=def=ghi' });
  });

  it('returns empty object for empty input', () => {
    expect(parseEnvFile('')).toEqual({});
  });
});

describe('serializeEnvFile', () => {
  it('serializes simple key-value pairs', () => {
    const data = { FOO: 'bar', BAZ: 'qux' };
    const result = serializeEnvFile(data);
    expect(result).toContain('FOO=bar');
    expect(result).toContain('BAZ=qux');
  });

  it('quotes values with spaces', () => {
    const data = { MSG: 'hello world' };
    expect(serializeEnvFile(data)).toContain('MSG="hello world"');
  });

  it('quotes empty values', () => {
    const data = { EMPTY: '' };
    expect(serializeEnvFile(data)).toContain('EMPTY=""');
  });

  it('round-trips through parse and serialize', () => {
    const original = { KEY: 'simple', MSG: 'hello world', EMPTY: '' };
    const serialized = serializeEnvFile(original);
    const reparsed = parseEnvFile(serialized);
    expect(reparsed).toEqual(original);
  });

  it('ends with a newline', () => {
    const data = { A: '1' };
    expect(serializeEnvFile(data).endsWith('\n')).toBe(true);
  });
});
