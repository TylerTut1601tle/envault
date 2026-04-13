# `rotate` Command

The `rotate` command re-encrypts one or all vault files with a new passphrase, enabling key rotation without losing encrypted data.

## Usage

```bash
# Rotate key for a single .env file
envault rotate .env --old-pass <passphrase> --new-pass <new-passphrase>

# Rotate keys for all tracked vaults in the repo
envault rotate --all --old-pass <passphrase> --new-pass <new-passphrase>
```

## How It Works

1. Decrypts the existing `.vault` file using the **old passphrase**.
2. Re-encrypts the plaintext content with the **new passphrase**.
3. Overwrites the `.vault` file in place.
4. The original `.env` file is **not modified**.

## Options

| Option | Description |
|---|---|
| `--all` | Rotate all tracked vault files in the repository |
| `--old-pass` | Current passphrase used to decrypt |
| `--new-pass` | New passphrase to encrypt with |

## Notes

- Only `.vault` files tracked by Git (via `.envault/config`) are included in `--all` rotation.
- If any vault fails during `--all`, the command continues and reports failures at the end.
- After rotation, share the new passphrase securely with your team (e.g., via a password manager).

## Exit Codes

| Code | Meaning |
|---|---|
| `0` | All rotations succeeded |
| `1` | One or more rotations failed |
