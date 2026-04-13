import * as fs from 'fs';
import * as path from 'path';
import { getVaultPath, isVaultFile } from '../crypto/vault';
import { getRepoRoot } from '../git/secrets';

export interface ChangelogEntry {
  timestamp: string;
  action: string;
  vault: string;
  user?: string;
  details?: string;
}

export function getChangelogPath(repoRoot: string): string {
  return path.join(repoRoot, '.envault', 'changelog.json');
}

export function readChangelog(repoRoot: string): ChangelogEntry[] {
  const changelogPath = getChangelogPath(repoRoot);
  if (!fs.existsSync(changelogPath)) return [];
  try {
    const raw = fs.readFileSync(changelogPath, 'utf-8');
    return JSON.parse(raw) as ChangelogEntry[];
  } catch {
    return [];
  }
}

export function writeChangelog(repoRoot: string, entries: ChangelogEntry[]): void {
  const changelogPath = getChangelogPath(repoRoot);
  const dir = path.dirname(changelogPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(changelogPath, JSON.stringify(entries, null, 2), 'utf-8');
}

export function appendChangelogEntry(repoRoot: string, entry: Omit<ChangelogEntry, 'timestamp'>): void {
  const entries = readChangelog(repoRoot);
  entries.push({ timestamp: new Date().toISOString(), ...entry });
  writeChangelog(repoRoot, entries);
}

export function formatChangelogResult(entries: ChangelogEntry[], vault?: string): string {
  const filtered = vault ? entries.filter(e => e.vault === vault) : entries;
  if (filtered.length === 0) return 'No changelog entries found.';
  return filtered
    .slice()
    .reverse()
    .map(e => {
      const parts = [`[${e.timestamp}]`, e.action, e.vault];
      if (e.user) parts.push(`by ${e.user}`);
      if (e.details) parts.push(`(${e.details})`);
      return parts.join(' ');
    })
    .join('\n');
}

export async function runChangelog(opts: { vault?: string; cwd?: string }): Promise<string> {
  const cwd = opts.cwd ?? process.cwd();
  const repoRoot = await getRepoRoot(cwd);
  const entries = readChangelog(repoRoot);
  return formatChangelogResult(entries, opts.vault);
}
