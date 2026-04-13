import fs from 'fs';
import path from 'path';
import { getVaultPath, decryptVaultFile } from '../crypto/vault';

export interface TemplateOptions {
  vault: string;
  templateFile: string;
  output?: string;
  password: string;
  envFile?: string;
}

export interface TemplateResult {
  success: boolean;
  message: string;
  rendered?: string;
}

export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\$\{([^}]+)\}|\$([A-Z_][A-Z0-9_]*)/g, (match, braced, bare) => {
    const key = braced ?? bare;
    return Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : match;
  });
}

export function formatTemplateResult(result: TemplateResult): string {
  return result.message;
}

export async function runTemplate(opts: TemplateOptions): Promise<TemplateResult> {
  const vaultPath = getVaultPath(opts.vault, opts.envFile ?? '.env');

  if (!fs.existsSync(vaultPath)) {
    return { success: false, message: `Vault not found: ${vaultPath}` };
  }

  if (!fs.existsSync(opts.templateFile)) {
    return { success: false, message: `Template file not found: ${opts.templateFile}` };
  }

  let vars: Record<string, string>;
  try {
    vars = await decryptVaultFile(vaultPath, opts.password);
  } catch {
    return { success: false, message: 'Failed to decrypt vault. Check your password.' };
  }

  const template = fs.readFileSync(opts.templateFile, 'utf-8');
  const rendered = renderTemplate(template, vars);

  if (opts.output) {
    const outDir = path.dirname(opts.output);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(opts.output, rendered, 'utf-8');
    return {
      success: true,
      message: `Template rendered to ${opts.output}`,
      rendered,
    };
  }

  return {
    success: true,
    message: rendered,
    rendered,
  };
}
