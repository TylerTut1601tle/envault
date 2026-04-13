import * as fs from 'fs';
import * as path from 'path';
import { getVaultPath, isVaultFile } from '../crypto/vault';

export interface TagResult {
  vault: string;
  tags: string[];
  added?: string[];
  removed?: string[];
}

const TAG_FILE = '.envault-tags.json';

export function getTagFilePath(dir: string): string {
  return path.join(dir, TAG_FILE);
}

export function readTags(dir: string): Record<string, string[]> {
  const tagFile = getTagFilePath(dir);
  if (!fs.existsSync(tagFile)) return {};
  try {
    return JSON.parse(fs.readFileSync(tagFile, 'utf8'));
  } catch {
    return {};
  }
}

export function writeTags(dir: string, tags: Record<string, string[]>): void {
  const tagFile = getTagFilePath(dir);
  fs.writeFileSync(tagFile, JSON.stringify(tags, null, 2) + '\n', 'utf8');
}

export function addTags(dir: string, vault: string, newTags: string[]): TagResult {
  const all = readTags(dir);
  const existing = all[vault] ?? [];
  const added = newTags.filter(t => !existing.includes(t));
  all[vault] = [...existing, ...added];
  writeTags(dir, all);
  return { vault, tags: all[vault], added };
}

export function removeTags(dir: string, vault: string, tagsToRemove: string[]): TagResult {
  const all = readTags(dir);
  const existing = all[vault] ?? [];
  const removed = tagsToRemove.filter(t => existing.includes(t));
  all[vault] = existing.filter(t => !tagsToRemove.includes(t));
  if (all[vault].length === 0) delete all[vault];
  writeTags(dir, all);
  return { vault, tags: all[vault] ?? [], removed };
}

export function listByTag(dir: string, tag: string): string[] {
  const all = readTags(dir);
  return Object.entries(all)
    .filter(([, tags]) => tags.includes(tag))
    .map(([vault]) => vault);
}

export function formatTagResult(result: TagResult): string {
  const lines: string[] = [`Vault: ${result.vault}`];
  if (result.added?.length) lines.push(`  Added tags: ${result.added.join(', ')}`);
  if (result.removed?.length) lines.push(`  Removed tags: ${result.removed.join(', ')}`);
  lines.push(`  Current tags: ${result.tags.length ? result.tags.join(', ') : '(none)'}`);
  return lines.join('\n');
}
