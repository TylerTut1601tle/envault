# envault import

Import an existing `.env` file into an encrypted vault.

## Usage

```bash
envault import <env-file> [options]
```

## Arguments

| Argument    | Description                          |
|-------------|--------------------------------------|
| `env-file`  | Path to the `.env` file to import    |

## Options

| Option              | Description                                      | Default      |
|---------------------|--------------------------------------------------|------------|
| `-n, --name <name>` | Name for the vault (e.g. `production`, `staging`)| `default`    |
| `-p, --password`    | Prompt for encryption password                   | *(prompted)*  |
| `--overwrite`       | Overwrite an existing vault with the same name   | `false`      |

## Examples

### Import a local `.env` file as `production`

```bash
envault import .env --name production
```

### Import with a specific name

```bash
envault import .env.staging --name staging
```

### Overwrite an existing vault

```bash
envault import .env --name production --overwrite
```

## Notes

- The original `.env` file is **not** deleted after import.
- The vault is stored in `.envault/<name>.vault` within the repository.
- If a vault with the given name already exists, the command will fail unless `--overwrite` is specified.
- Use `envault lock` to encrypt an existing tracked `.env` file instead.
- Use `envault unlock` to decrypt a vault back into a `.env` file.
- Passwords are never stored; always use the same password to unlock.
