# `envault keys`

List all variable keys stored inside an encrypted vault without revealing their values.

## Usage

```
envault keys <vault> [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `vault`  | Name of the vault file (e.g. `.env`, `.env.production`) |

## Options

| Option | Description |
|--------|-------------|
| `-p, --password <password>` | Encryption password |
| `--env-pass <envVar>` | Environment variable holding the password |

## Examples

```bash
# List keys using a password prompt
envault keys .env

# List keys using inline password
envault keys .env.production --password mysecret

# List keys using an environment variable
envault keys .env --env-pass ENVAULT_PASS
```

## Output

```
Keys in vault ".env" (3):
  - DATABASE_URL
  - API_KEY
  - SECRET_TOKEN
```

This command is useful for quickly inspecting what variables exist in a vault without decrypting the values.
