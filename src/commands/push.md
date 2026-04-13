# `envault push <env-file>`

Registers a locked vault file for Git tracking so it can be shared with your team.

## Usage

```bash
envault push .env
envault push .env.staging
```

## Description

After locking an env file with `envault lock`, the resulting `.vault.enc` file needs to be
committed to your repository so teammates can access it. The `push` command:

1. Verifies you are inside a Git repository.
2. Confirms the source env file exists.
3. Confirms the corresponding vault file has been created (via `lock`).
4. Ensures the vault directory (`.envault/`) is not listed in `.gitignore`.
5. Reports whether the vault is already tracked or newly registered.

After running `push`, commit the vault file manually:

```bash
git add .envault/.env.vault.enc
git commit -m "chore: add encrypted env vault"
git push
```

## Workflow

```
1. envault lock .env          # encrypt
2. envault push .env          # register for tracking
3. git add .envault/ && git commit && git push
4. teammate: git pull
5. teammate: envault pull .env  # fetch vault
6. teammate: envault unlock .env  # decrypt
```

## Notes

- The vault file is encrypted; it is safe to commit to public repositories provided
  a strong passphrase is used.
- Never commit the plaintext `.env` file. It should remain in `.gitignore`.
- Use `envault rotate` periodically to re-encrypt with a new passphrase.
