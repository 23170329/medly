/** Valida coherencia básica CURP ↔ nombre/apellidos/fecha (reglas MX simplificadas). */

export function apellidoMaternoEfectivo(raw: string): string {
  const t = raw.trim().toUpperCase();
  if (!t || t === '-') return '';
  return t;
}

export function primeraConsonanteInterna(apellido: string): string {
  for (let i = 1; i < apellido.length; i++) {
    const c = apellido[i];
    if (/[BCDFGHJKLMNPQRSTVWXYZ]/.test(c)) return c;
  }
  return 'X';
}

export function validarCoherenciaCurpServidor(params: {
  curp: string;
  nombre: string;
  apellido_pat: string;
  apellido_mat?: string | null;
  fechaNacimiento: string;
}): string | null {
  const curp = params.curp.trim().toUpperCase();
  if (!/^[A-Z0-9]{18}$/.test(curp)) {
    return 'La CURP debe tener 18 caracteres alfanuméricos.';
  }

  const paterno = params.apellido_pat.trim().toUpperCase();
  const materno = apellidoMaternoEfectivo(params.apellido_mat ?? '');
  const nombre = params.nombre.trim().toUpperCase();

  if (!paterno.startsWith(curp[0])) {
    return 'La CURP no coincide con el apellido paterno.';
  }

  const vocalesPaterno = paterno.slice(1).match(/[AEIOU]/);
  const vocalEsperada = vocalesPaterno ? vocalesPaterno[0] : 'X';
  if (curp[1] !== vocalEsperada) {
    return 'La segunda letra de la CURP no coincide con el apellido paterno.';
  }

  const letraTerceraEsperada = materno
    ? materno[0]
    : primeraConsonanteInterna(paterno);
  if (curp[2] !== letraTerceraEsperada) {
    return materno
      ? 'La tercera letra de la CURP no coincide con el apellido materno.'
      : 'La tercera letra de la CURP no coincide con la primera consonante interna del apellido paterno.';
  }

  const palabras = nombre.split(/[\s]+/);
  const primerNombre = palabras.find(
    (p) => p !== 'JOSE' && p !== 'MARIA' && p !== 'MA',
  );
  const letraNombre = (primerNombre ?? palabras[0] ?? 'X')[0];
  if (curp[3] !== letraNombre) {
    return 'La cuarta letra de la CURP no coincide con el nombre.';
  }

  const iso = params.fechaNacimiento.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const fechaEsperada = `${iso[1].slice(-2)}${iso[2]}${iso[3]}`;
    if (curp.slice(4, 10) !== fechaEsperada) {
      return 'La fecha en la CURP no coincide con la fecha de nacimiento.';
    }
  }

  return null;
}
