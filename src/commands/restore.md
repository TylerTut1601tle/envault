# `envault restore`

Restore a `.env` file from a previously taken snapshot of a vault.

## Usage

```bash
envault restore <vault> <snapshot-id> [options]
```

## Arguments

| Argument      | Description                                      |
|---------------|--------------------------------------------------|
| `vault`       | Path to the `.vault` file to restore from        |
| `snapshot-id` | ID (or unique prefix) of the snapshot to restore |

## Options

| Flag                    | Description                                          |
|-------------------------|------------------------------------------------------|
| `-o, --output <path>`   | Output path for the restored `.env` file             |
| `-p, --password <pass>` | Encryption password (prompted if not provided)       |

## Examples

### Restore to default location

```bash
envault restore .envault/production.vault abc12345
```

Restores the snapshot with ID starting with `abc12345` and writes the result to `production.env` next to the vault file.

### Restore to a custom path

```bash
envault restore .envault/production.vault abc12345 --output /tmp/recovered.env
```

## Notes

- Snapshot IDs can be abbreviated to any unique prefix.
- Use `envault snapshot list <vault>` to view available snapshots.
- The restored file is **not** automatically locked; it is written as a plain `.env` file.
- The original vault file is left unchanged.
