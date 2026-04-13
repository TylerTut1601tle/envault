import * as fs from 'fs';
import * as path from 'path';

const REGISTRY_FILE = '.envault/tracked.json';

export interface TrackedEntry {
  envFile: string;
  vaultPath: string;
  addedAt: string;
}

export function readRegistry(repoRoot: string): TrackedEntry[] {
  const registryPath = path.join(repoRoot, REGISTRY_FILE);
  if (!fs.existsSync(registryPath)) return [];
  try {
    const raw = fs.readFileSync(registryPath, 'utf8');
    return JSON.parse(raw) as TrackedEntry[];
  } catch {
    return [];
  }
}

export function writeRegistry(repoRoot: string, entries: TrackedEntry[]): void {
  const registryPath = path.join(repoRoot, REGISTRY_FILE);
  const dir = path.dirname(registryPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(registryPath, JSON.stringify(entries, null, 2) + '\n', 'utf8');
}

export function registerVault(
  repoRoot: string,
  envFile: string,
  vaultPath: string
): { added: boolean } {
  const entries = readRegistry(repoRoot);
  const exists = entries.some((e) => e.vaultPath === vaultPath);
  if (exists) return { added: false };

  entries.push({
    envFile,
    vaultPath,
    addedAt: new Date().toISOString(),
  });
  writeRegistry(repoRoot, entries);
  return { added: true };
}

export function unregisterVault(repoRoot: string, vaultPath: string): { removed: boolean } {
  const entries = readRegistry(repoRoot);
  const filtered = entries.filter((e) => e.vaultPath !== vaultPath);
  if (filtered.length === entries.length) return { removed: false };
  writeRegistry(repoRoot, filtered);
  return { removed: true };
}
