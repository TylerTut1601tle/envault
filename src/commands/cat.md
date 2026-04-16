# `envault cat`

Print the decrypted contents of a vault file directly to stdout.

## Usage

```
envault cat [env] [options]
```

## Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `env` | Name of the env file to read | `.env` |

## Options

| Flag | Description |
|------|-------------|
| `-p, --password <password>` | Encryption password (prompted if omitted) |

## Examples

```bash
# Print decrypted .env to stdout
envault cat

# Print a specific env file
envault cat .env.production

# Pipe into another tool
envault cat | grep API_KEY
```

## Notes

- The vault must already exist (use `envault lock` to create one).
- Output is plain text — avoid logging or storing in insecure locations.
- Useful for quick inspection or piping into other tools.
