/** Valida coherencia básica CURP ↔ nombre/apellidos/fecha (reglas MX simplificadas). */
export function validarCoherenciaCurpServidor(params: {
  curp: string;
  nombre: string;
  apellido_pat: string;
  apellido_mat: string;
  fechaNacimiento: string;
}): string | null {
  const curp = params.curp.trim().toUpperCase();
  if (!/^[A-Z0-9]{18}$/.test(curp)) {
    return 'La CURP debe tener 18 caracteres alfanuméricos.';
  }

  const paterno = params.apellido_pat.trim().toUpperCase();
  const materno = params.apellido_mat.trim().toUpperCase();
  const nombre = params.nombre.trim().toUpperCase();

  if (!paterno.startsWith(curp[0])) {
    return 'La CURP no coincide con el apellido paterno.';
  }

  const vocalesPaterno = paterno.slice(1).match(/[AEIOU]/);
  const vocalEsperada = vocalesPaterno ? vocalesPaterno[0] : 'X';
  if (curp[1] !== vocalEsperada) {
    return 'La segunda letra de la CURP no coincide con el apellido paterno.';
  }

  const letraMaterno = materno ? materno[0] : 'X';
  if (materno && curp[2] !== letraMaterno) {
    return 'La tercera letra de la CURP no coincide con el apellido materno.';
  }
  if (!materno && curp[2] !== 'X') {
    return 'La tercera letra de la CURP debe ser X sin apellido materno.';
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
