# envault audit

Scans all vaults in the `.envault/` directory and reports their status, including orphaned vaults that no longer have a corresponding `.env` file.

## Usage

```bash
envault audit
```

## Output

For each vault found, the audit command reports:

- **Status — `✓` if a matching `.env` file exists, `⚠ orphaned` if not
- **Name** — the environment name ( `production`, `staging`)
- **Size** — vault file size in bytes
- **Last modified** — date the vault was last updated

## Example

```
Found 3 vault(s):

  [✓] production  (512B, modified 2024-06-01)
  [✓] staging     (480B, modified 2024-05-28)
  [⚠ orphaned] old-test  (256B, modified 2024-03-10)

⚠  1 orphaned vault(s) have no matching .env file.
```

## Exit Code

- `0` — all vaults are healthy
- `1` — one or more orphaned vaults detected

## Notes

- Orphaned vaults can be removed with `envault delete <name>`.
- This command is read-only and does not modify any files.
