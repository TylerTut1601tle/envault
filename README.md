# envault

> A CLI tool for managing and encrypting local `.env` files with team-sharing support via Git-compatible secrets.

---

## Installation

```bash
npm install -g envault
```

---

## Usage

Initialize envault in your project and encrypt your `.env` file:

```bash
# Initialize a new vault in the current project
envault init

# Encrypt your .env file with a shared team key
envault encrypt --file .env --key MY_TEAM_KEY

# Decrypt a shared .env.vault file
envault decrypt --file .env.vault --key MY_TEAM_KEY

# Push encrypted secrets to your Git-compatible store
envault push

# Pull and decrypt the latest secrets
envault pull
```

The encrypted `.env.vault` file is safe to commit to version control. Team members with the shared key can decrypt it locally using `envault pull`.

---

## How It Works

1. `envault init` sets up a local `.envault` config file
2. Your `.env` is encrypted using AES-256 and saved as `.env.vault`
3. `.env.vault` is committed to Git — your raw `.env` never is
4. Teammates run `envault pull` to decrypt and restore their local `.env`

Add `.env` to your `.gitignore` and commit `.env.vault` instead.

---

## Requirements

- Node.js >= 18
- npm or yarn

---

## License

[MIT](./LICENSE) © envault contributors