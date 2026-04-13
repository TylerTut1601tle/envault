import * as fs from 'fs';
import * as path from 'path';
import { parseEnvFile, serializeEnvFile } from '../env/parser';
import { getVaultPath } from '../crypto/vault';

export interface TemplateResult {
  templatePath: string;
  keyCount: number;
  skipped: boolean;
}

/**
 * Generates a .env.template file from an existing vault or .env file,
 * stripping all values and leaving only keys (with optional comments preserved).
 */
export async function generateTemplate(
  dir: string,
  envName: string = '.env',
  outputPath?: string
): Promise<TemplateResult> {
  const vaultPath = getVaultPath(dir, envName);
  const envPath = path.join(dir, envName);
  const templatePath = outputPath ?? path.join(dir, `${envName}.template`);

  // Prefer the plain .env file if it exists, otherwise require vault
  let sourcePath: string;
  if (fs.existsSync(envPath)) {
    sourcePath = envPath;
  } else if (fs.existsSync(vaultPath)) {
    throw new Error(
      `Source .env file not found at ${envPath}. Unlock the vault first with: envault unlock`
    );
  } else {
    throw new Error(`No .env file found at ${envPath}`);
  }

  if (fs.existsSync(templatePath)) {
    return { templatePath, keyCount: 0, skipped: true };
  }

  const raw = fs.readFileSync(sourcePath, 'utf-8');
  const entries = parseEnvFile(raw);

  // Strip values — keep keys and comments, blank out values
  const stripped = entries.map((entry) => ({
    ...entry,
    value: entry.key ? '' : entry.value,
  }));

  const templateContent = serializeEnvFile(stripped);
  fs.writeFileSync(templatePath, templateContent, 'utf-8');

  const keyCount = stripped.filter((e) => e.key).length;
  return { templatePath, keyCount, skipped: false };
}

export function formatTemplateResult(result: TemplateResult): string {
  if (result.skipped) {
    return `⚠️  Template already exists at ${result.templatePath} — skipped.`;
  }
  return [
    `✅ Template generated: ${result.templatePath}`,
    `   ${result.keyCount} key(s) exported with blank values.`,
    `   Commit this file to share the expected env shape with your team.`,
  ].join('\n');
}
