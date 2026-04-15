# `envault grep`

Search for environment variable keys (and optionally values) matching a pattern across one or more vaults.

## Usage

```
envault grep <pattern> [options]
```

## Arguments

| Argument  | Description                          |
|-----------|--------------------------------------|
| `pattern` | Regular expression pattern to search |

## Options

| Option              | Description                                          |
|---------------------|------------------------------------------------------|
| `-v, --values`      | Also search inside values (not just keys)            |
| `--show-values`     | Display matched values in output (masked by default) |
| `--vault <name>`    | Restrict search to a specific vault                  |
| `-p, --password`    | Encryption password (or uses prompt / env var)       |

## Examples

```bash
# Find all keys containing "DB"
envault grep DB

# Search both keys and values for "secret", show values
envault grep secret --values --show-values

# Search only in the production vault
envault grep API --vault prod
```

## Notes

- Pattern is treated as a **case-insensitive regular expression**.
- Values are never displayed unless `--show-values` is explicitly passed.
- Vaults that cannot be decrypted with the given password are silently skipped.
- Exits with code `1` if the pattern is an invalid regular expression.
