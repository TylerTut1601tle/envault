import * as fs from 'fs';
import * as path from 'path';
import { parseEnvFile, serializeEnvFile } from '../env/parser';

export type ConvertFormat = 'dotenv' | 'json' | 'yaml' | 'export';

export interface ConvertResult {
  success: boolean;
  inputPath: string;
  outputPath: string;
  format: ConvertFormat;
  keyCount: number;
  error?: string;
}

function envMapToJson(map: Record<string, string>): string {
  return JSON.stringify(map, null, 2);
}

function envMapToYaml(map: Record<string, string>): string {
  return Object.entries(map)
    .map(([k, v]) => `${k}: "${v.replace(/"/g, '\\"')}"`)
    .join('\n');
}

function envMapToExport(map: Record<string, string>): string {
  return Object.entries(map)
    .map(([k, v]) => `export ${k}="${v.replace(/"/g, '\\"')}"`)
    .join('\n');
}

export async function convertEnvFile(
  inputPath: string,
  outputPath: string,
  format: ConvertFormat
): Promise<ConvertResult> {
  if (!fs.existsSync(inputPath)) {
    return { success: false, inputPath, outputPath, format, keyCount: 0, error: `File not found: ${inputPath}` };
  }

  const raw = fs.readFileSync(inputPath, 'utf-8');
  const entries = parseEnvFile(raw);
  const map: Record<string, string> = {};
  for (const e of entries) {
    if (e.key) map[e.key] = e.value ?? '';
  }
  const keyCount = Object.keys(map).length;

  let output: string;
  switch (format) {
    case 'json':   output = envMapToJson(map); break;
    case 'yaml':   output = envMapToYaml(map); break;
    case 'export': output = envMapToExport(map); break;
    default:       output = serializeEnvFile(entries); break;
  }

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, output, 'utf-8');
  return { success: true, inputPath, outputPath, format, keyCount };
}

export function formatConvertResult(result: ConvertResult): string {
  if (!result.success) return `✗ Convert failed: ${result.error}`;
  return `✓ Converted ${result.keyCount} key(s) from "${result.inputPath}" to ${result.format.toUpperCase()} → "${result.outputPath}"`;
}
