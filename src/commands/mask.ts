import * as fs from 'fs';
import { decryptVaultFile, getVaultPath } from '../crypto/vault';
import { parseEnvFile } from '../env/parser';

export interface MaskOptions {
  show?: number;
  char?: string;
  keys?: string[];
}

export function maskValue(value: string, show: number = 0, char: string = '*'): string {
  if (value.length === 0) return '';
  if (show <= 0) return char.repeat(Math.min(value.length, 8));
  const visible = Math.min(show, Math.floor(value.length / 2));
  const masked = char.repeat(Math.max(value.length - visible, 4));
  return masked + value.slice(-visible);
}

export interface MaskResult {
  file: string;
  entries: Array<{ key: string; masked: string }>;
  total: number;
}

export async function runMask(
  envFile: string,
  password: string,
  options: MaskOptions = {}
): Promise<MaskResult> {
  const vaultPath = getVaultPath(envFile);
  const source = fs.existsSync(vaultPath) ? vaultPath : envFile;
  let content: string;

  if (source === vaultPath) {
    content = await decryptVaultFile(vaultPath, password);
  } else {
    content = fs.readFileSync(envFile, 'utf-8');
  }

  const entries = parseEnvFile(content);
  const { show = 0, char = '*', keys } = options;

  const result: Array<{ key: string; masked: string }> = [];

  for (const [key, value] of Object.entries(entries)) {
    if (keys && keys.length > 0 && !keys.includes(key)) continue;
    result.push({ key, masked: maskValue(value, show, char) });
  }

  return { file: source, entries: result, total: result.length };
}

export function formatMaskResult(result: MaskResult): string {
  if (result.total === 0) {
    return `No entries found in ${result.file}`;
  }
  const lines = result.entries.map(({ key, masked }) => `${key}=${masked}`);
  return lines.join('\n');
}
