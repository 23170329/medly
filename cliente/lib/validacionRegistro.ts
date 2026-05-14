/** CURP: 18 caracteres alfanuméricos (se normaliza a mayúsculas). */
export const REGEX_CURP = /^[A-Z0-9]{18}$/;

/** Correo con formato razonablemente estricto (RFC simplificado). */
export const REGEX_CORREO =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function normalizarCurp(curp: string): string {
  return curp.trim().toUpperCase().replace(/\s/g, "");
}

export function validarPasoDatosPersonales(params: {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  genero: string;
  curp: string;
}): string | null {
  const n = params.nombres.trim();
  if (n.length < 1 || n.length > 50) {
    return "Indica tu nombre (máx. 50 caracteres).";
  }
  const ap = params.apellidoPaterno.trim();
  if (ap.length < 1 || ap.length > 15) {
    return "El apellido paterno es obligatorio (máx. 15 caracteres).";
  }
  const am = params.apellidoMaterno.trim();
  if (am.length > 15) {
    return "El apellido materno no puede superar 15 caracteres.";
  }
  if (!params.fechaNacimiento.trim()) {
    return "Selecciona tu fecha de nacimiento.";
  }
  if (!params.genero) {
    return "Selecciona género.";
  }
  const curp = normalizarCurp(params.curp);
  if (!REGEX_CURP.test(curp)) {
    return "La CURP debe tener exactamente 18 caracteres alfanuméricos.";
  }
  return null;
}

export function validarPasoAcceso(params: {
  telefono: string;
  correo: string;
  contrasena: string;
  confirmarContrasena: string;
}): string | null {
  const tel = params.telefono.replace(/\D/g, "");
  if (tel.length !== 10) {
    return "El teléfono debe tener 10 dígitos.";
  }
  const email = params.correo.trim();
  if (!email || email.length > 150) {
    return "Indica un correo electrónico válido.";
  }
  if (!REGEX_CORREO.test(email)) {
    return "El formato del correo electrónico no es válido.";
  }
  if (params.contrasena.length < 8 || params.contrasena.length > 72) {
    return "La contraseña debe tener entre 8 y 72 caracteres.";
  }
  if (!/^(?=.*[A-Za-zÁÉÍÓÚÑáéíóúñ])(?=.*\d).{8,}$/.test(params.contrasena)) {
    return "La contraseña debe incluir al menos una letra y un número.";
  }
  if (params.contrasena !== params.confirmarContrasena) {
    return "Las contraseñas no coinciden.";
  }
  return null;
}
