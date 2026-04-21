import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { encryptEnvFile, getVaultPath } from '../crypto/vault';
import { formatWatchResult, runWatch, WatchResult } from './watch';

function makeTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'envault-watch-'));
}

describe('formatWatchResult', () => {
  it('formats a changed event', () => {
    const result: WatchResult = { vaultPath: '/tmp/test.env.vault', event: 'changed', keyCount: 3 };
    expect(formatWatchResult(result)).toContain('3 key(s) loaded');
    expect(formatWatchResult(result)).toContain('test.env.vault');
  });

  it('formats an error event', () => {
    const result: WatchResult = { vaultPath: '/tmp/test.env.vault', event: 'error', error: 'bad password' };
    expect(formatWatchResult(result)).toContain('Error');
    expect(formatWatchResult(result)).toContain('bad password');
  });
});

describe('runWatch', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTempDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('calls onChange immediately with key count on valid vault', async () => {
    const envContent = 'FOO=bar\nBAZ=qux\n';
    const vaultName = path.join(tmpDir, getVaultPath('.env'));
    await encryptEnvFile(envContent, vaultName, 'secret');

    const results: WatchResult[] = [];
    const stop = await runWatch('.env', 'secret', tmpDir, (r) => results.push(r));
    stop();

    expect(results).toHaveLength(1);
    expect(results[0].event).toBe('changed');
    expect(results[0].keyCount).toBe(2);
  });

  it('calls onChange with error event on wrong password', async () => {
    const envContent = 'FOO=bar\n';
    const vaultName = path.join(tmpDir, getVaultPath('.env'));
    await encryptEnvFile(envContent, vaultName, 'correct');

    const results: WatchResult[] = [];
    const stop = await runWatch('.env', 'wrong', tmpDir, (r) => results.push(r));
    stop();

    expect(results).toHaveLength(1);
    expect(results[0].event).toBe('error');
    expect(results[0].error).toBeDefined();
  });

  it('returns a stop function that closes the watcher', async () => {
    const envContent = 'KEY=val\n';
    const vaultName = path.join(tmpDir, getVaultPath('.env'));
    await encryptEnvFile(envContent, vaultName, 'pw');

    const results: WatchResult[] = [];
    const stop = await runWatch('.env', 'pw', tmpDir, (r) => results.push(r));
    expect(typeof stop).toBe('function');
    stop(); // should not throw
  });
});
