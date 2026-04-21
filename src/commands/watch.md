# `envault watch`

Watch a vault file for changes and automatically decrypt and report the current key count whenever the file is updated.

## Usage

```
envault watch <env-file> [options]
```

## Arguments

| Argument    | Description                                |
|-------------|--------------------------------------------|
| `env-file`  | The `.env` file or vault file to watch     |

## Options

| Option                    | Description                                       | Default              |
|---------------------------|---------------------------------------------------|----------------------|
| `-p, --password <pass>`   | Encryption password                               | —                    |
| `--env-password <var>`    | Environment variable holding the password         | `ENVAULT_PASSWORD`   |

## Examples

```bash
# Watch .env.vault using a password flag
envault watch .env --password mysecret

# Watch using an environment variable
ENVAULT_PASSWORD=mysecret envault watch .env
```

## Notes

- The command prints a line each time the vault file changes on disk.
- Press `Ctrl+C` to stop watching.
- If decryption fails (e.g. wrong password), an error line is printed but watching continues.
- Useful for debugging or verifying that a vault is being updated correctly by another process.
