# `envault truncate`

Keep only the first N keys in a vault file, removing the rest.

## Usage

```bash
envault truncate <file> --keep <n> [--password <password>]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `file`   | The `.env` file or vault name to truncate |

## Options

| Option | Description |
|--------|-------------|
| `-k, --keep <n>` | Number of keys to keep (required) |
| `-p, --password <password>` | Encryption password (prompted if omitted) |

## Examples

### Keep only the first 5 keys

```bash
envault truncate .env --keep 5
```

### Truncate a named vault

```bash
envault truncate production --keep 10 --password mypassword
```

## Notes

- Keys are kept in the order they appear in the vault.
- If `--keep` is greater than or equal to the number of existing keys, no changes are made.
- Setting `--keep 0` removes all keys from the vault.
- The vault is re-encrypted after truncation.
