import * as fs from 'fs';
import { parseEnvFile } from '../env/parser';
import { decryptVaultFile, getVaultPath, isVaultFile } from '../crypto/vault';

export interface LintIssue {
  line: number;
  key: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface LintResult {
  file: string;
  issues: LintIssue[];
  ok: boolean;
}

export function lintEnvContent(content: string): LintIssue[] {
  const issues: LintIssue[] = [];
  const lines = content.split('\n');
  const seenKeys = new Map<string, number>();

  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) {
      issues.push({ line: lineNum, key: trimmed, message: 'Missing "=" in assignment', severity: 'error' });
      return;
    }

    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();

    if (!key) {
      issues.push({ line: lineNum, key: '(empty)', message: 'Empty key name', severity: 'error' });
      return;
    }

    if (!/^[A-Z_][A-Z0-9_]*$/i.test(key)) {
      issues.push({ line: lineNum, key, message: `Key "${key}" contains invalid characters`, severity: 'warning' });
    }

    if (seenKeys.has(key)) {
      issues.push({ line: lineNum, key, message: `Duplicate key "${key}" (first seen on line ${seenKeys.get(key)})`, severity: 'error' });
    } else {
      seenKeys.set(key, lineNum);
    }

    if (!value) {
      issues.push({ line: lineNum, key, message: `Key "${key}" has an empty value`, severity: 'warning' });
    }
  });

  return issues;
}

export async function runLint(filePath: string, password: string): Promise<LintResult> {
  let content: string;

  if (isVaultFile(filePath)) {
    const encrypted = fs.readFileSync(filePath, 'utf-8');
    content = await decryptVaultFile(encrypted, password);
  } else {
    content = fs.readFileSync(filePath, 'utf-8');
  }

  const issues = lintEnvContent(content);
  return { file: filePath, issues, ok: issues.filter(i => i.severity === 'error').length === 0 };
}

export function formatLintResult(result: LintResult): string {
  if (result.issues.length === 0) {
    return `✅ ${result.file}: No issues found.`;
  }
  const lines = [`🔍 ${result.file}: ${result.issues.length} issue(s) found`];
  for (const issue of result.issues) {
    const icon = issue.severity === 'error' ? '❌' : '⚠️';
    lines.push(`  ${icon} Line ${issue.line} [${issue.key}]: ${issue.message}`);
  }
  return lines.join('\n');
}
