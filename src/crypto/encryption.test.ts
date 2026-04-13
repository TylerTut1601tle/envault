import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, deriveKey } from './encryption';
import { randomBytes } from 'crypto';

describe('deriveKey', () => {
  it('should derive a 32-byte key from passphrase and salt', () => {
    const salt = randomBytes(16);
    const key = deriveKey('my-secret', salt);
    expect(key.length).toBe(32);
  });

  it('should produce the same key for the same inputs', () => {
    const salt = randomBytes(16);
    const key1 = deriveKey('passphrase', salt);
    const key2 = deriveKey('passphrase', salt);
    expect(key1.equals(key2)).toBe(true);
  });

  it('should produce different keys for different salts', () => {
    const salt1 = randomBytes(16);
    const salt2 = randomBytes(16);
    const key1 = deriveKey('passphrase', salt1);
    const key2 = deriveKey('passphrase', salt2);
    expect(key1.equals(key2)).toBe(false);
  });

  it('should produce different keys for different passphrases', () => {
    const salt = randomBytes(16);
    const key1 = deriveKey('passphrase-a', salt);
    const key2 = deriveKey('passphrase-b', salt);
    expect(key1.equals(key2)).toBe(false);
  });
});

describe('encrypt / decrypt', () => {
  it('should encrypt and decrypt a string correctly', () => {
    const original = 'DATABASE_URL=postgres://localhost/mydb';
    const passphrase = 'super-secret-pass';
    const ciphertext = encrypt(original, passphrase);
    const decrypted = decrypt(ciphertext, passphrase);
    expect(decrypted).toBe(original);
  });

  it('should produce different ciphertexts for the same input (random IV)', () => {
    const plaintext = 'API_KEY=abc123';
    const passphrase = 'pass';
    const c1 = encrypt(plaintext, passphrase);
    const c2 = encrypt(plaintext, passphrase);
    expect(c1).not.toBe(c2);
  });

  it('should throw on wrong passphrase', () => {
    const ciphertext = encrypt('SECRET=value', 'correct-pass');
    expect(() => decrypt(ciphertext, 'wrong-pass')).toThrow(
      'Decryption failed: invalid passphrase or corrupted data'
    );
  });

  it('should throw on malformed ciphertext', () => {
    expect(() => decrypt('not-valid-base64!!', 'pass')).toThrow();
  });

  it('should handle multiline env file content', () => {
    const content = 'KEY1=value1\nKEY2=value2\nKEY3="hello world"';
    const passphrase = 'envault-key';
    expect(decrypt(encrypt(content, passphrase), passphrase)).toBe(content);
  });

  it('should handle an empty string', () => {
    const passphrase = 'envault-key';
    expect(decrypt(encrypt('', passphrase), passphrase)).toBe('');
  });
});
