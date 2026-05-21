import {
  normalizarIdentificadorLogin,
  esCurp,
  esTelefono,
} from './identificador-login.util';

describe('identificador-login.util', () => {
  it('normaliza correo a minúsculas', () => {
    expect(normalizarIdentificadorLogin('  Ana@Mail.COM ')).toBe('ana@mail.com');
  });

  it('normaliza CURP sin espacios y mayúsculas', () => {
    expect(normalizarIdentificadorLogin('pelj 900101 hdfrrn07')).toBe(
      'PELJ900101HDFRRN07',
    );
  });

  it('normaliza teléfono a 10 dígitos', () => {
    expect(normalizarIdentificadorLogin('55-1234-5678')).toBe('5512345678');
    expect(normalizarIdentificadorLogin('+52 55 1234 5678')).toBe('5512345678');
  });

  it('detecta tipo', () => {
    expect(esCurp('PELJ900101HDFRRN07')).toBe(true);
    expect(esTelefono('5512345678')).toBe(true);
  });
});
