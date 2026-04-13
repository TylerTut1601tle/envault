# `envault export`

Decrypts a vault and writes the plaintext `.env` file to disk.

## Usage

```bash
envault export [env-name] [options]
```

## Arguments

| Argument   | Description                                      | Default     |
|------------|--------------------------------------------------|-------------|
| `env-name` | Name of the vault to export (e.g. `staging`)     | `default`   |

## Options

| Flag              | Description                                           |
|-------------------|-------------------------------------------------------|
| `-o, --output`    | Custom output file path (default: `.env.<name>`)      |
| `-p, --password`  | Password for decryption (prompted if not provided)    |

## Examples

```bash
# Export the default vault to .env
envault export

# Export the staging vault to .env.staging
envault export staging

# Export to a custom path
envault export production --output /tmp/prod.env

# Pass password directly (not recommended for scripts)
envault export staging --password mysecret
```

## Notes

- The output file will be **overwritten** if it already exists.
- The exported `.env` file is **not encrypted** — treat it as sensitive.
- Consider adding the output path to `.gitignore` to avoid accidental commits.
- Vault files are stored under `.envault/` and remain encrypted after export.
