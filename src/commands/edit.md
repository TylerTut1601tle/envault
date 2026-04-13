# `envault edit`

Open an encrypted vault file in your default editor, then re-encrypt it on save.

## Usage

```bash
envault edit [env-file] [options]
```

### Arguments

| Argument    | Description                          | Default  |
|-------------|--------------------------------------|----------|
| `env-file`  | Path to the `.env` file to edit      | `.env`   |

### Options

| Flag                   | Description                                      |
|------------------------|--------------------------------------------------|
| `-p, --passphrase <p>` | Passphrase used to decrypt/re-encrypt the vault  |

## Behavior

1. Decrypts the vault file (`.env.vault`) using the provided passphrase.
2. Writes the plaintext content to a temporary file.
3. Opens the temporary file in `$EDITOR` (falls back to `vi`).
4. After the editor exits:
   - If content is **unchanged**, no vault update is performed.
   - If content **changed**, the `.env` file is written, re-encrypted into the vault, and the plaintext file is removed.
5. The temporary file is always cleaned up.

## Examples

```bash
# Edit the default .env vault
envault edit --passphrase mysecret

# Edit a specific env file
envault edit .env.production --passphrase mysecret
```

## Notes

- The `.env` file is **never left on disk** after editing; only the encrypted vault persists.
- Set `$EDITOR` or `$VISUAL` in your shell profile to use your preferred editor (e.g., `code --wait`, `nano`).
- You must have already locked the file with `envault lock` before editing.
