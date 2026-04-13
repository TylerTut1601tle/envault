# envault diff

Compare the current `.env` file against its encrypted vault snapshot.

## Usage

```bash
envault diff [env-file] --password <password>
envault diff [env-file] --password-file <path>
```

## Arguments

| Argument    | Description                              | Default |
|-------------|------------------------------------------|---------|
| `env-file`  | Path to the `.env` file to compare       | `.env`  |

## Options

| Option            | Description                                 |
|-------------------|---------------------------------------------|
| `--password`      | Password used to decrypt the vault          |
| `--password-file` | Path to a file containing the password      |

## Output

The diff output uses the following symbols:

- `+` Key was **added** in the current `.env` (not present in vault)
- `-` Key was **removed** from the current `.env` (present in vault)
- `~` Key **value changed** between the current `.env` and vault

If there are no differences, the message `No differences found.` is shown.

## Example

```bash
$ envault diff .env --password mysecret
+ NEW_API_KEY
- DEPRECATED_TOKEN
~ DATABASE_URL
```

## Notes

- The vault file (`.env.vault`) must exist. Run `envault lock` first to create it.
- Values are never displayed in the diff output to avoid leaking secrets.
- Use `envault status` to see which files are locked/unlocked.
