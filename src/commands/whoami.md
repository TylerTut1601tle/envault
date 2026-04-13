# envault whoami

Display the current envault identity and configuration details.

## Usage

```bash
envault whoami
```

## Description

The `whoami` command shows information about the current envault environment, including:

- **git user / email** — pulled from local or global git config
- **config path** — location of the envault config file (`~/.envault/config.json`)
- **password** — whether a stored password entry exists
- **repo root** — the root of the current git repository, if applicable

## Example Output

```
envault identity:
  git user:   Alice Smith
  git email:  alice@example.com
  config:     /home/alice/.envault/config.json
  password:   stored
  repo root:  /home/alice/projects/my-app
```

## Notes

- If you are not inside a git repository, the `repo root` line will indicate that.
- If no password has been stored, you will be prompted for one when running commands that require encryption.
- This command never reads or decrypts any vault files.
