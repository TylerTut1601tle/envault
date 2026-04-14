import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { encryptEnvFile, getVaultPath } from '../crypto/vault';
import { ensureGitignoreEntry } from '../git/init';
import { ensureVaultDirTracked } from '../git/secrets';

export interface AddOptions {
  envFile?: string;
  passphrase?: string;
  cwd?: string;
}

export interface AddResult {
  envFile: string;
  vaultFile: string;
  alreadyExists: boolean;
}

async function promptPassphrase(): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question('Enter passphrase: ', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Encrypts an env file into the vault, adds it to .gitignore, and ensures
 * the vault directory is tracked by git.
 *
 * @param options - Configuration options including env file path, passphrase, and working directory.
 * @returns Details about the operation, including the vault file path and whether it already existed.
 * @throws If the env file does not exist or the passphrase is empty.
 */
export async function addEnvFile(options: AddOptions = {}): Promise<AddResult> {
  const cwd = options.cwd ?? process.cwd();
  const envFile = options.envFile ?? '.env';
  const envFilePath = path.resolve(cwd, envFile);

  if (!fs.existsSync(envFilePath)) {
    throw new Error(`Env file not found: ${envFilePath}`);
  }

  if (!fs.statSync(envFilePath).isFile()) {
    throw new Error(`Path is not a file: ${envFilePath}`);
  }

  const passphrase = options.passphrase ?? (await promptPassphrase());
  if (!passphrase || passphrase.trim().length === 0) {
    throw new Error('Passphrase must not be empty');
  }

  const vaultFile = getVaultPath(envFilePath);
  const alreadyExists = fs.existsSync(vaultFile);

  await encryptEnvFile(envFilePath, passphrase);
  await ensureGitignoreEntry(cwd, envFile);
  await ensureVaultDirTracked(cwd);

  return {
    envFile: path.relative(cwd, envFilePath),
    vaultFile: path.relative(cwd, vaultFile),
    alreadyExists,
  };
}

export function formatAddResult(result: AddResult): string {
  const action = result.alreadyExists ? 'Updated' : 'Created';
  return [
    `${action} vault: ${result.vaultFile}`,
    `Source:  ${result.envFile} (gitignored)`,
  ].join('\n');
}
