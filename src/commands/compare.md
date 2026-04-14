# `envault compare`

Compare two encrypted vault files side by side to identify differences in keys and values.

## Usage

```bash
envault compare <envA> <envB> [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `envA`   | Name of the first vault (e.g. `dev`) |
| `envB`   | Name of the second vault (e.g. `prod`) |

## Options

| Option | Description |
|--------|-------------|
| `-p, --password <password>` | Encryption password (prompted if omitted) |
| `--show-same` | Also display keys that have identical values in both vaults |

## Output

The command prints a summary of:

- Keys **only in envA** (prefixed with `-`)
- Keys **only in envB** (prefixed with `+`)
- Keys with **different values** (prefixed with `~`)
- Number of **identical keys** (shown with `--show-same`)

If both vaults are identical, a confirmation message is shown.

## Examples

```bash
# Compare dev and prod vaults
envault compare dev prod

# Compare and show identical keys too
envault compare staging prod --show-same

# Provide password inline
envault compare dev prod --password mysecret
```

## Notes

- Both vaults must exist in the `.envault/` directory.
- The same password is used to decrypt both vaults.
- Values are compared exactly (case-sensitive, whitespace-sensitive).
