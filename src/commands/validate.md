# envault validate

Validate a vault's contents against a schema `.env` file to ensure all required keys are present.

## Usage

```
envault validate [env] [options]
```

## Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `env`    | Path to the `.env` file whose vault to validate | `.env` |

## Options

| Option | Description |
|--------|-------------|
| `-s, --schema <path>` | Path to a schema `.env` file listing required keys |
| `-p, --password <password>` | Encryption password |
| `--password-env <var>` | Environment variable containing the password (default: `ENVAULT_PASSWORD`) |

## Schema File

A schema file is a plain `.env` file where only the **keys** matter — values are ignored. Any key present in the schema is treated as required.

```env
# .env.schema
DATABASE_URL=
REDIS_URL=
SECRET_KEY=
```

## Examples

```bash
# Validate the default vault (no schema)
envault validate

# Validate with a schema to check required keys
envault validate --schema .env.schema

# Validate a named vault
envault validate .env.production --schema .env.schema

# Use password from environment variable
ENVAULT_PASSWORD=mysecret envault validate --schema .env.schema
```

## Exit Codes

| Code | Meaning |
|------|---------|
| `0`  | Vault is valid |
| `1`  | Vault is invalid or an error occurred |
