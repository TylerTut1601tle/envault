# `envault add` Command

Adds a `.env` file to envault management by encrypting it into a vault file.

## Usage

```bash
envault add [env-file] [options]
```

### Arguments

| Argument    | Default | Description                        |
|-------------|---------|------------------------------------|
| `env-file`  | `.env`  | Path to the env file to encrypt    |

### Options

| Flag                    | Description                              |
|-------------------------|------------------------------------------|
| `-p, --passphrase <p>`  | Passphrase for encryption (prompted if omitted) |

## Behaviour

1. Reads the specified `.env` file from the current working directory.
2. Encrypts it using AES-256-GCM with a key derived from the passphrase via PBKDF2.
3. Writes the vault file to `.envault/<filename>.vault`.
4. Appends the original env file to `.gitignore` so it is never committed.
5. Ensures `.envault/` is tracked by Git.

## Example

```bash
# Add default .env
envault add

# Add a named env file
envault add .env.production --passphrase "my-secret-passphrase"
```

## Output

```
Created vault: .envault/.env.vault
Source:  .env (gitignored)
```

> **Note:** The passphrase is never stored. Team members must share it securely out-of-band.
