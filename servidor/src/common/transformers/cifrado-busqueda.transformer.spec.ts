import { crearCifradoBusqueda } from './cifrado-busqueda.transformer';

const TEST_KEY =
  'b7cf1088784054a5103c8ed26852db7aeab5e6ea5354eeb398bba9a1e3eb58e2';

describe('crearCifradoBusqueda', () => {
  beforeAll(() => {
    process.env.DATA_ENCRYPTION_KEY = TEST_KEY;
  });

  describe('roundtrip', () => {
    it('to() encrypts and from() decrypts back to original', () => {
      const transformer = crearCifradoBusqueda('email');
      const original = 'usuario@ejemplo.com';
      const encrypted = transformer.to(original);
      const decrypted = transformer.from(encrypted);
      expect(decrypted).toBe(original);
    });
  });

  describe('deterministic encryption', () => {
    it('same plaintext produces SAME ciphertext for the same column', () => {
      const transformer = crearCifradoBusqueda('curp');
      const plaintext = 'HEXA123456MDFRRN01';
      const result1 = transformer.to(plaintext);
      const result2 = transformer.to(plaintext);
      expect(result1).toBe(result2);
    });
  });

  describe('column name isolation', () => {
    it('different column names produce different ciphertext for same plaintext', () => {
      const emailTransformer = crearCifradoBusqueda('email');
      const curpTransformer = crearCifradoBusqueda('curp');
      const plaintext = 'test@example.com';
      const emailEncrypted = emailTransformer.to(plaintext);
      const curpEncrypted = curpTransformer.to(plaintext);
      expect(emailEncrypted).not.toBe(curpEncrypted);
    });
  });

  describe('null handling', () => {
    it('to(null) returns null', () => {
      const transformer = crearCifradoBusqueda('email');
      expect(transformer.to(null)).toBeNull();
    });

    it('from(null) returns null', () => {
      const transformer = crearCifradoBusqueda('email');
      expect(transformer.from(null)).toBeNull();
    });
  });

  describe('real-world values', () => {
    it('roundtrip works for emails', () => {
      const transformer = crearCifradoBusqueda('email');
      const emails = [
        'a@b.com',
        'user+tag@domain.co.uk',
        'very.common@example.com',
      ];
      for (const email of emails) {
        const encrypted = transformer.to(email);
        const decrypted = transformer.from(encrypted);
        expect(decrypted).toBe(email);
      }
    });

    it('roundtrip works for CURPs', () => {
      const transformer = crearCifradoBusqueda('curp');
      const curps = ['HEXA123456MDFRRN01', 'JUAP890101HDFRRN07'];
      for (const curp of curps) {
        const encrypted = transformer.to(curp);
        const decrypted = transformer.from(encrypted);
        expect(decrypted).toBe(curp);
      }
    });
  });
});
