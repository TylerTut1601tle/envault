# `envault merge` — Merge env variables into a vault

Merge keys from a source `.env` file or `.vault` file into an existing target vault.

## Usage

```bash
envault merge <source> <target-env> [options]
```

### Arguments

| Argument      | Description                                                  |
|---------------|--------------------------------------------------------------|
| `source`      | Path to a `.env` file or a `.vault` file to merge from      |
| `target-env`  | Name of the target environment vault (e.g. `production`)    |

### Options

| Flag            | Description                                             |
|-----------------|---------------------------------------------------------|
| `--overwrite`   | Overwrite existing keys in the target vault             |
| `--password`    | Encryption password (or uses `ENVAULT_PASSWORD` env)    |

## Behaviour

- Keys present in `source` but **not** in the target vault are **added**.
- Keys present in **both** are **skipped** by default (use `--overwrite` to replace them).
- Comments and blank lines from the source are ignored during merge.
- The target vault is re-encrypted after the merge.

## Examples

```bash
# Merge .env.local into the staging vault (skip conflicts)
envault merge .env.local staging

# Merge and overwrite any conflicting keys
envault merge .env.local staging --overwrite

# Merge from another vault
envault merge .envault/dev.vault production
```

## Notes

- Both source and target must be accessible with the **same password**.
- The source file is never modified.
