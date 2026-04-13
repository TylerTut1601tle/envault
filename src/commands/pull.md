# `envault pull`

Decrypts all tracked `.vault` files in the repository and writes the corresponding `.env` files to disk.

## Usage

```bash
envault pull [--passphrase <passphrase>]
```

## Options

| Option | Description |
|---|---|
| `--passphrase`, `-p` | Passphrase used to decrypt vault files. If omitted, the `ENVAULT_PASSPHRASE` environment variable is used. |

## Description

`envault pull` is the counterpart to `envault lock`. It reads all `.vault` files tracked by Git in the repository (stored under `.envault/`) and decrypts them back into their original `.env` files.

This is useful when:
- A team member has pushed updated vault files after rotating secrets.
- You have cloned a repository and need to restore local `.env` files.
- You want to refresh your local environment after a `git pull`.

## Example

```bash
# Pull and decrypt all vaults using an env variable
export ENVAULT_PASSPHRASE="my-shared-secret"
envault pull

# Or pass the passphrase directly
envault pull --passphrase "my-shared-secret"
```

## Output

```
✅ Pulled 2 vault(s):
   • .env
   • apps/api/.env
```

## Notes

- Existing `.env` files will be **overwritten** without confirmation.
- Only files with a `.vault` extension that are tracked by Git will be processed.
- Use `envault status` to inspect which vaults are available before pulling.
