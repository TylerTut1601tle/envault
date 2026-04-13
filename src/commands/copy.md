# `envault copy` — Copy a Vault

Copies all keys from one encrypted vault to another. Both vaults use the same password.

## Usage

```bash
envault copy <source> <destination> [options]
```

## Arguments

| Argument      | Description                              |
|---------------|------------------------------------------|
| `source`      | Source `.env` file name (e.g. `.env`)    |
| `destination` | Target `.env` file name (e.g. `.env.staging`) |

## Options

| Flag               | Description                          |
|--------------------|--------------------------------------|
| `-p, --password`   | Encryption password (or use `ENVAULT_PASSWORD` env var) |

## Examples

```bash
# Copy .env vault to .env.staging
envault copy .env .env.staging

# With explicit password
envault copy .env .env.prod --password mysecret
```

## Notes

- The destination vault is created if it does not exist.
- If the destination vault already exists, it will be **overwritten** after a warning.
- The source vault must have been previously locked with `envault lock`.
- Both source and destination share the same password in this operation.
