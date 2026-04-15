# `envault pack`

Bundle all tracked encrypted vault files into a single portable archive file.

## Usage

```bash
envault pack <output> [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `output` | Path to the output bundle file (e.g. `envault-bundle.json`) |

## Options

| Option | Description |
|--------|-------------|
| `-p, --password <password>` | Encryption password (prompted if omitted) |
| `-d, --dir <dir>` | Working directory (defaults to current directory) |

## Description

The `pack` command collects all tracked `.envault` vault files and writes them
into a single JSON bundle. This is useful for:

- Backing up all vaults at once
- Sharing a complete set of vaults with a team member
- Migrating vaults to a new machine or repository

The output bundle is a plain JSON file containing the encrypted vault contents.
No decryption occurs during packing — the vaults remain encrypted.

## Examples

```bash
# Pack all vaults into a bundle file
envault pack envault-bundle.json

# Pack with an explicit password
envault pack backup.json --password mypassword

# Pack from a specific project directory
envault pack /tmp/bundle.json --dir /path/to/project
```

## Notes

- Only vaults tracked in the envault registry are included.
- The bundle format is versioned (`"version": 1`) for future compatibility.
- Use `envault unpack` (coming soon) to restore vaults from a bundle.
