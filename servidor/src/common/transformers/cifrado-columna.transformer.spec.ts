import { CifrarColumna } from './cifrado-columna.transformer';

const TEST_KEY =
  'b7cf1088784054a5103c8ed26852db7aeab5e6ea5354eeb398bba9a1e3eb58e2';

describe('CifrarColumna', () => {
  beforeAll(() => {
    process.env.DATA_ENCRYPTION_KEY = TEST_KEY;
  });

  describe('to()', () => {
    it('encrypts a string and returns iv:tag:ciphertext format (3 parts)', () => {
      const result = CifrarColumna.to('Hola Mundo');
      expect(result).not.toBeNull();
      const parts = result!.split(':');
      expect(parts).toHaveLength(3);
      expect(parts[0]).toHaveLength(32); // 16 bytes hex = 32 chars
      expect(parts[1]).toHaveLength(32); // 16 bytes tag hex = 32 chars
    });

    it('returns null for null input', () => {
      expect(CifrarColumna.to(null)).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(CifrarColumna.to('')).toBeNull();
    });

    it('returns null for undefined', () => {
      expect(CifrarColumna.to(undefined)).toBeNull();
    });
  });

  describe('from()', () => {
    it('decrypts back to the original string (roundtrip)', () => {
      const original = 'Hola Mundo';
      const encrypted = CifrarColumna.to(original);
      const decrypted = CifrarColumna.from(encrypted);
      expect(decrypted).toBe(original);
    });

    it('returns null for null input', () => {
      expect(CifrarColumna.from(null)).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(CifrarColumna.from('')).toBeNull();
    });

    it('returns null for undefined', () => {
      expect(CifrarColumna.from(undefined)).toBeNull();
    });

    it('returns null for malformed input (invalid format)', () => {
      expect(CifrarColumna.from('invalid')).toBeNull();
      expect(CifrarColumna.from('abc:def')).toBeNull();
      expect(CifrarColumna.from('a:b:c:d')).toBeNull();
    });
  });

  describe('non-deterministic encryption', () => {
    it('produces different ciphertext each time for the same plaintext', () => {
      const plaintext = 'Correo@ejemplo.com';
      const result1 = CifrarColumna.to(plaintext);
      const result2 = CifrarColumna.to(plaintext);
      expect(result1).not.toBe(result2);
    });
  });

  describe('special characters and edge cases', () => {
    it('handles special characters (ñ, á, é, etc.)', () => {
      const original = 'María José Pérez-Muñóz ñáéíóú';
      const encrypted = CifrarColumna.to(original);
      const decrypted = CifrarColumna.from(encrypted);
      expect(decrypted).toBe(original);
    });

    it('handles long strings', () => {
      const original = 'a'.repeat(5000);
      const encrypted = CifrarColumna.to(original);
      const decrypted = CifrarColumna.from(encrypted);
      expect(decrypted).toBe(original);
    });
  });

  describe('error handling', () => {
    it('throws error when DATA_ENCRYPTION_KEY is missing', () => {
      const originalKey = process.env.DATA_ENCRYPTION_KEY;
      delete process.env.DATA_ENCRYPTION_KEY;
      expect(() => CifrarColumna.to('test')).toThrow(
        'DATA_ENCRYPTION_KEY debe ser una cadena hex de 64 caracteres (32 bytes)',
      );
      process.env.DATA_ENCRYPTION_KEY = originalKey;
    });
  });
});
