# strip

Remove one or more keys from an encrypted vault file.

## Usage

```
envault strip <vault> <keys...> [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `vault`  | Name of the vault to modify |
| `keys`   | One or more key names to remove |

## Options

| Option | Description |
|--------|-------------|
| `-p, --password <password>` | Vault password (prompted if omitted) |
| `--dry-run` | Preview changes without writing to disk |

## Examples

```bash
# Remove a single key
envault strip production SECRET_KEY

# Remove multiple keys
envault strip production OLD_API_KEY DEPRECATED_TOKEN

# Preview what would be removed
envault strip production STALE_VAR --dry-run
```

## Notes

- Keys not found in the vault are reported but do not cause an error.
- Use `envault keys <vault>` to list all keys before stripping.
- Changes are written atomically; the vault remains encrypted.
