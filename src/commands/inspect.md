# envault inspect

Decrypt a vault and display its metadata and key names — without printing values.

## Usage

```bash
envault inspect [env-file] [options]
```

## Arguments

| Argument    | Description                          | Default  |
|-------------|--------------------------------------|----------|
| `env-file`  | The `.env` file whose vault to inspect | `.env` |

## Options

| Flag             | Description                        |
|------------------|------------------------------------|
| `-p, --password` | Encryption password (or use `ENVAULT_PASSWORD` env var) |

## Examples

```bash
# Inspect the default .env vault
envault inspect

# Inspect a named vault
envault inspect .env.staging

# Pass password via flag
envault inspect .env.production --password mysecret
```

## Output

Displays vault file path, source env file, vault size in bytes, and a list of
all key names stored in the vault. **Values are never shown.**

## Notes

- The vault must exist (created via `envault lock`).
- Useful for auditing what variables are stored without exposing their values.
- Works well in CI pipelines to verify vault contents before deployment.
