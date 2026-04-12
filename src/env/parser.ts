/**
 * Parses a raw .env file string into a key-value record.
 * Supports:
 *  - KEY=VALUE
 *  - KEY="VALUE WITH SPACES"
 *  - KEY='VALUE'
 *  - Inline comments after values
 *  - Full-line comments (#)
 *  - Blank lines (ignored)
 *  - Export prefix (export KEY=VALUE)
 */
export function parseEnvFile(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip blank lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Strip optional 'export ' prefix
    const stripped = trimmed.startsWith('export ')
      ? trimmed.slice(7).trim()
      : trimmed;

    const eqIndex = stripped.indexOf('=');
    if (eqIndex === -1) continue;

    const key = stripped.slice(0, eqIndex).trim();
    let value = stripped.slice(eqIndex + 1);

    // Handle quoted values
    if (
      (value.startsWith('"') && value.includes('"', 1)) ||
      (value.startsWith("'") && value.includes("'", 1))
    ) {
      const quote = value[0];
      const closeIdx = value.indexOf(quote, 1);
      value = value.slice(1, closeIdx);
    } else {
      // Strip inline comments
      const commentIdx = value.indexOf(' #');
      if (commentIdx !== -1) {
        value = value.slice(0, commentIdx);
      }
      value = value.trim();
    }

    if (key) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Serializes a key-value record back into .env file format.
 * Values containing spaces or special characters are double-quoted.
 */
export function serializeEnvFile(data: Record<string, string>): string {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    const needsQuotes = /[\s#"'\\]/.test(value) || value === '';
    const serializedValue = needsQuotes
      ? `"${value.replace(/"/g, '\\"')}"`
      : value;
    lines.push(`${key}=${serializedValue}`);
  }

  return lines.join('\n') + '\n';
}
