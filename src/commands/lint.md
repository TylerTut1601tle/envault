# `envault lint`

Lint a `.env` or encrypted vault file for common issues.

## Usage

```bash
envault lint <file> [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `file`   | Path to a `.env` file or `.vault` encrypted file |

## Options

| Option | Description |
|--------|-------------|
| `-p, --password <password>` | Password for decrypting vault files |
| `--fail-on-warnings` | Exit with code 1 even when only warnings are found |

## What is checked

- **Missing `=`** — Lines that are not comments or blank but have no `=` sign are errors.
- **Empty key** — Lines that start with `=` produce an error.
- **Duplicate keys** — A key appearing more than once is an error.
- **Invalid key characters** — Keys should match `[A-Z_][A-Z0-9_]*` (case-insensitive); others produce a warning.
- **Empty values** — Keys with no value produce a warning.

## Exit codes

| Code | Meaning |
|------|---------|
| `0`  | No errors (and no warnings if `--fail-on-warnings` is set) |
| `1`  | One or more errors found (or warnings with `--fail-on-warnings`) |

## Examples

```bash
# Lint a plain .env file
envault lint .env

# Lint an encrypted vault
envault lint .env.vault --password mysecret

# Treat warnings as errors in CI
envault lint .env --fail-on-warnings
```
