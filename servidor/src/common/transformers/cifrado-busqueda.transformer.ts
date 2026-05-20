import { ValueTransformer } from 'typeorm';
import * as crypto from 'crypto';

/**
 * Cifrado determinista con AES-256-GCM para columnas que necesitan
 * ser buscables por igualdad exacta (CURP, email).
 *
 * El IV se deriva del HMAC-SHA256 del valor cifrado, garantizando que
 * el mismo texto plano siempre produzca el mismo cifrado (determinista).
 */
function getKey(name: string): Buffer {
  const hex = process.env.DATA_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error(
      'DATA_ENCRYPTION_KEY debe ser una cadena hex de 64 caracteres (32 bytes)',
    );
  }
  const master = Buffer.from(hex, 'hex');
  return crypto.createHmac('sha256', master).update(name).digest();
}

export function crearCifradoBusqueda(
  name: string,
): ValueTransformer {
  const key = getKey(name);

  return {
    to(value: string | null | undefined): string | null {
      if (value == null || value === '') return null;
      const iv = crypto
        .createHash('sha256')
        .update(value)
        .digest()
        .subarray(0, 12);
      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      const encrypted = Buffer.concat([
        cipher.update(value, 'utf8'),
        cipher.final(),
      ]);
      const tag = cipher.getAuthTag();
      return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
    },

    from(value: string | null | undefined): string | null {
      if (value == null || value === '') return null;
      const parts = value.split(':');
      if (parts.length !== 3) return null;
      const iv = Buffer.from(parts[0], 'hex');
      const tag = Buffer.from(parts[1], 'hex');
      const encrypted = Buffer.from(parts[2], 'hex');
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);
      return decrypted.toString('utf8');
    },
  };
}
