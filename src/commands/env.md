# `envault env`

Print decrypted environment variables from a vault in various formats.

## Usage

```bash
envault env [name] [options]
```

## Arguments

| Argument | Description                          | Default |
|----------|--------------------------------------|---------|
| `name`   | Name of the vault / env file         | `.env`  |

## Options

| Flag                    | Description                                      | Default    |
|-------------------------|--------------------------------------------------|------------|
| `-p, --password <pass>` | Encryption password (prompted if not provided)   | *(prompt)* |
| `-f, --format <fmt>`    | Output format: `export`, `dotenv`, or `json`     | `export`   |

## Formats

### `export` (default)

Outputs shell `export` statements, suitable for `eval $(envault env)`:

```
export API_KEY="abc123"
export DB_URL="postgres://localhost/mydb"
```

### `dotenv`

Outputs raw key=value pairs:

```
API_KEY=abc123
DB_URL=postgres://localhost/mydb
```

### `json`

Outputs a JSON object:

```json
{
  "API_KEY": "abc123",
  "DB_URL": "postgres://localhost/mydb"
}
```

## Examples

```bash
# Print as export statements (default)
envault env

# Source variables directly into current shell
eval $(envault env -p mypassword)

# Print staging vault as JSON
envault env .env.staging --format json

# Print production vault as dotenv
envault env .env.production --format dotenv
```
