# `envault tag`

Add, remove, or list tags for a vault. Tags help you organize and filter vaults by environment, team, or purpose.

## Usage

```bash
envault tag <vault> [options]
```

## Options

| Option | Description |
|--------|-------------|
| `--add <tags...>` | Add one or more tags to the vault |
| `--remove <tags...>` | Remove one or more tags from the vault |
| `--list-by <tag>` | List all vaults that have a specific tag |
| `--dir <dir>` | Working directory (default: current directory) |

## Examples

### Add tags to a vault

```bash
envault tag .env --add dev local
```

### Remove a tag

```bash
envault tag .env --remove local
```

### Show current tags for a vault

```bash
envault tag .env
# Tags for .env: dev, local
```

### Find all vaults tagged with `dev`

```bash
envault tag .env --list-by dev
# Vaults tagged "dev":
#   - .env
#   - .env.staging
```

## Storage

Tags are stored in `.envault-tags.json` in the working directory. This file can be committed to Git so your team shares the same tag organization.

## Notes

- Tags are case-sensitive.
- Duplicate tags are ignored when adding.
- If all tags are removed from a vault, the vault entry is cleaned up from the tags file.
