/** Normaliza correo, CURP o teléfono para búsqueda de paciente. */
export function normalizarIdentificadorLogin(raw: string): string {
  const id = raw.trim();
  if (!id) return id;
  if (id.includes('@')) {
    return id.toLowerCase();
  }
  const soloAlfanum = id.replace(/\s/g, '').toUpperCase();
  if (
    soloAlfanum.length >= 16 &&
    soloAlfanum.length <= 18 &&
    /^[A-Z0-9]+$/.test(soloAlfanum)
  ) {
    return soloAlfanum;
  }
  const digitos = id.replace(/\D/g, '');
  if (digitos.length >= 10) {
    if (digitos.length === 12 && digitos.startsWith('52')) {
      return digitos.slice(2);
    }
    if (digitos.length === 13 && digitos.startsWith('521')) {
      return digitos.slice(3);
    }
    return digitos;
  }
  return id;
}

export function esCurp(identificador: string): boolean {
  const c = identificador.replace(/\s/g, '').toUpperCase();
  return c.length >= 16 && c.length <= 18 && /^[A-Z0-9]+$/.test(c);
}

export function esTelefono(identificador: string): boolean {
  return /^\d{10,13}$/.test(identificador.replace(/\D/g, ''));
}
