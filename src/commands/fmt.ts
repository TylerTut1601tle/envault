import * as fs from 'fs';
import { parseEnvFile, serializeEnvFile } from '../env/parser';
import { getVaultPath, isVaultFile } from '../crypto/vault';

export interface FmtOptions {
  dir?: string;
  check?: boolean;
  sortKeys?: boolean;
}

export interface FmtResult {
  file: string;
  changed: boolean;
  error?: string;
}

export function formatFmtResult(results: FmtResult[], checkMode: boolean): string {
  const changed = results.filter((r) => r.changed);
  const errors = results.filter((r) => r.error);

  const lines: string[] = [];

  for (const r of results) {
    if (r.error) {
      lines.push(`  ✗ ${r.file}: ${r.error}`);
    } else if (r.changed) {
      lines.push(`  ${checkMode ? '✗ would reformat' : '✓ reformatted'}: ${r.file}`);
    } else {
      lines.push(`  ✓ ok: ${r.file}`);
    }
  }

  lines.push('');

  if (errors.length > 0) {
    lines.push(`${errors.length} file(s) had errors.`);
  } else if (checkMode && changed.length > 0) {
    lines.push(`${changed.length} file(s) would be reformatted.`);
  } else if (!checkMode && changed.length > 0) {
    lines.push(`${changed.length} file(s) reformatted.`);
  } else {
    lines.push('All files are properly formatted.');
  }

  return lines.join('\n');
}

export async function runFmt(opts: FmtOptions = {}): Promise<FmtResult[]> {
  const dir = opts.dir ?? process.cwd();
  const sortKeys = opts.sortKeys ?? false;
  const checkMode = opts.check ?? false;

  const envaultDir = `${dir}/.envault`;
  if (!fs.existsSync(envaultDir)) {
    return [];
  }

  const vaultFiles = fs
    .readdirSync(envaultDir)
    .filter((f) => isVaultFile(f))
    .map((f) => `${envaultDir}/${f}`);

  const envFiles = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith('.env') && !isVaultFile(f) && fs.statSync(`${dir}/${f}`).isFile())
    .map((f) => `${dir}/${f}`);

  const results: FmtResult[] = [];

  for (const file of envFiles) {
    try {
      const original = fs.readFileSync(file, 'utf8');
      const entries = parseEnvFile(original);
      if (sortKeys) {
        entries.sort((a, b) => {
          if (!a.key) return 1;
          if (!b.key) return -1;
          return a.key.localeCompare(b.key);
        });
      }
      const formatted = serializeEnvFile(entries);
      const changed = formatted !== original;
      if (changed && !checkMode) {
        fs.writeFileSync(file, formatted, 'utf8');
      }
      results.push({ file, changed });
    } catch (err: any) {
      results.push({ file, changed: false, error: err.message });
    }
  }

  return results;
}
