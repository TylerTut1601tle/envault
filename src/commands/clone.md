# `envault clone`

Clone an existing encrypted vault to a new vault file with the same password.

## Usage

```bash
envault clone <source> <destination> [options]
```

## Arguments

| Argument      | Description                              |
|---------------|------------------------------------------|
| `source`      | Name of the source `.env` file to clone  |
| `destination` | Name of the new destination `.env` file  |

## Options

| Flag              | Description                              |
|-------------------|------------------------------------------|
| `-p, --password`  | Password used for encryption/decryption  |

## Examples

```bash
# Clone .env into .env.staging
envault clone .env .env.staging

# Clone with explicit password
envault clone .env .env.backup --password mysecret
```

## Notes

- The source vault must already exist and be decryptable with the provided password.
- The destination vault must **not** already exist; use `rename` or `delete` first if needed.
- The cloned vault uses the same password as the source vault.
- Both vaults are stored independently — changes to one do not affect the other.
