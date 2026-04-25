# `envault mask`

Display env file values with masked/redacted output. Useful for safely sharing terminal output or screenshots without exposing secrets.

## Usage

```bash
envault mask <file> [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `file`   | Path to the `.env` file or vault to mask |

## Options

| Option | Default | Description |
|--------|---------|-------------|
| `-p, --password <password>` | (prompt) | Password to decrypt vault file |
| `-s, --show <n>` | `0` | Number of trailing characters to reveal |
| `-c, --char <char>` | `*` | Character used for masking |
| `-k, --keys <keys>` | all | Comma-separated list of keys to mask |

## Examples

### Mask all values in a vault

```bash
envault mask .env
# FOO=********
# BAR=********
```

### Reveal last 3 characters

```bash
envault mask .env --show 3
# API_KEY=*****key
# DB_PASS=***ord
```

### Mask specific keys only

```bash
envault mask .env --keys API_KEY,DB_PASS
```

### Use a custom masking character

```bash
envault mask .env --char '#'
# API_KEY=########
```

## Notes

- If a `.env.vault` file exists alongside the given `.env` path, the vault is decrypted automatically.
- The output is printed to stdout and is safe to share or log.
