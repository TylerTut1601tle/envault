# envault prefix

Add a prefix to all keys in an encrypted vault.

## Usage

```
envault prefix <envfile> <prefix> [options]
```

## Arguments

| Argument   | Description                              |
|------------|------------------------------------------|
| `envfile`  | Path to the `.env` file (vault source)   |
| `prefix`   | Prefix string to prepend to each key     |

## Options

| Option              | Description                                              |
|---------------------|----------------------------------------------------------|
| `-d, --vault-dir`   | Directory where vault files are stored                   |
| `--dry-run`         | Preview changes without writing to the vault             |
| `--overwrite`       | Overwrite existing keys that conflict with prefixed names|

## Description

The `prefix` command renames all keys in the specified vault by prepending
a given prefix. The prefix is automatically normalized to uppercase and
non-alphanumeric characters (except underscores) are converted to `_`.

Keys that already start with the prefix are skipped. If a target key name
already exists, the original key is skipped unless `--overwrite` is set.

## Examples

```bash
# Add PROD_ prefix to all keys in .env
envault prefix .env PROD_

# Preview changes without writing
envault prefix .env STAGING_ --dry-run

# Force overwrite conflicts
envault prefix .env APP_ --overwrite
```

## Notes

- The vault password will be prompted if `ENVAULT_PASSWORD` is not set.
- Changes are written back to the encrypted vault immediately.
- Use `--dry-run` to safely preview which keys would be affected.
