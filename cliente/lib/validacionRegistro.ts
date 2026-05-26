/** CURP: 18 caracteres alfanuméricos (se normaliza a mayúsculas). */
export const REGEX_CURP = /^[A-Z0-9]{18}$/;

/** Nombres y apellidos: letras (incl. acentos) y espacios. */
export const REGEX_SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÑáéíóúñÜü\s]+$/;

export function filtrarEntradaSoloLetras(texto: string): string {
  return texto.replace(/[^A-Za-zÁÉÍÓÚÑáéíóúñüÜ\s]/g, "");
}

function errorCampoSoloLetras(
  valor: string,
  obligatorio: boolean,
): string | null {
  const t = valor.trim();
  if (!t) return obligatorio ? null : null;
  if (!REGEX_SOLO_LETRAS.test(t)) {
    return "Solo se permiten letras y espacios.";
  }
  return null;
}

/** Correo con formato razonablemente estricto (RFC simplificado). */
export const REGEX_CORREO =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function normalizarCurp(curp: string): string {
  return curp.trim().toUpperCase().replace(/\s/g, "");
}

export function apellidoMaternoEfectivo(raw: string): string {
  const t = raw.trim().toUpperCase();
  if (!t || t === "-") return "";
  return t;
}

export function primeraConsonanteInterna(apellido: string): string {
  for (let i = 1; i < apellido.length; i++) {
    const c = apellido[i];
    if (/[BCDFGHJKLMNPQRSTVWXYZ]/.test(c)) return c;
  }
  return "X";
}

export interface ErroresPaso {
  readonly [campo: string]: string | null;
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
  const errN = errorCampoSoloLetras(n, true);
  if (errN) return errN;
  const ap = params.apellidoPaterno.trim();
  if (ap.length < 1 || ap.length > 15) {
    return "El apellido paterno es obligatorio (máx. 15 caracteres).";
  }
  const errAp = errorCampoSoloLetras(ap, true);
  if (errAp) return errAp;
  const am = params.apellidoMaterno.trim();
  if (am.length > 15) {
    return "El apellido materno no puede exceder 15 caracteres.";
  }
  const errAm = errorCampoSoloLetras(am, false);
  if (errAm) return errAm;
  if (!params.fechaNacimiento.trim()) {
    return "Selecciona tu fecha de nacimiento.";
  }
  const gen = params.genero.trim().toUpperCase();
  if (!gen || !["H", "M"].includes(gen)) {
    return "Selecciona género (H o M).";
  }
  const curp = normalizarCurp(params.curp);
  if (!REGEX_CURP.test(curp)) {
    return "La CURP debe tener exactamente 18 caracteres alfanuméricos.";
  }
  return null;
}

export function validarPasoDatosPersonalesDetallado(params: {
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
  genero: string;
  curp: string;
}): ErroresPaso {
  const n = params.nombres.trim();
  const ap = params.apellidoPaterno.trim();
  const am = params.apellidoMaterno.trim();
  const curp = normalizarCurp(params.curp);
  return {
    nombres:
      n.length < 1 || n.length > 50
        ? "Indica tu nombre (máx. 50 caracteres)."
        : errorCampoSoloLetras(n, true),
    apellidoPaterno:
      ap.length < 1 || ap.length > 15
        ? "El apellido paterno es obligatorio (máx. 15 caracteres)."
        : errorCampoSoloLetras(ap, true),
    apellidoMaterno:
      am.length > 15
        ? "El apellido materno no puede exceder 15 caracteres."
        : errorCampoSoloLetras(am, false),
    fechaNacimiento: !params.fechaNacimiento.trim()
      ? "Selecciona tu fecha de nacimiento."
      : null,
    genero:
      !params.genero.trim() ||
      !["H", "M"].includes(params.genero.trim().toUpperCase())
        ? "Selecciona género (H o M)."
        : null,
    curp: !REGEX_CURP.test(curp)
      ? "La CURP debe tener exactamente 18 caracteres alfanuméricos."
      : null,
  };
}

/** Registro desde recepción: teléfono obligatorio; correo opcional (sin contraseña en formulario). */
export function validarPasoAccesoRecepcion(params: {
  telefono: string;
  correo: string;
}): string | null {
  const tel = params.telefono.replace(/\D/g, "");
  if (tel.length !== 10) {
    return "El teléfono es obligatorio y debe tener 10 dígitos.";
  }
  const email = params.correo.trim();
  if (email) {
    if (email.length > 150) {
      return "El correo no puede exceder 150 caracteres.";
    }
    if (!REGEX_CORREO.test(email)) {
      return "El formato del correo electrónico no es válido.";
    }
    if (/@medly\./i.test(email)) {
      return "No se permiten correos con dominio @medly.";
    }
  }
  return null;
}

export function validarPasoAccesoRecepcionDetallado(params: {
  telefono: string;
  correo: string;
}): ErroresPaso {
  const tel = params.telefono.replace(/\D/g, "");
  const email = params.correo.trim();
  return {
    telefono:
      tel.length !== 10
        ? "El teléfono es obligatorio y debe tener 10 dígitos."
        : null,
    correo: email
      ? email.length > 150
        ? "El correo no puede exceder 150 caracteres."
        : !REGEX_CORREO.test(email)
          ? "El formato del correo electrónico no es válido."
          : /@medly\./i.test(email)
            ? "No se permiten correos con dominio @medly."
            : null
      : null,
  };
}

/** Registro paciente (autoregistro): teléfono obligatorio; correo opcional; contraseña obligatoria. */
export function validarPasoAcceso(params: {
  telefono: string;
  correo: string;
  contrasena: string;
  confirmarContrasena: string;
}): string | null {
  const base = validarPasoAccesoRecepcion({
    telefono: params.telefono,
    correo: params.correo,
  });
  if (base) return base;
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

export function validarPasoAccesoDetallado(params: {
  telefono: string;
  correo: string;
  contrasena: string;
  confirmarContrasena: string;
}): ErroresPaso {
  const tel = params.telefono.replace(/\D/g, "");
  const email = params.correo.trim();
  return {
    telefono:
      tel.length !== 10
        ? "El teléfono es obligatorio y debe tener 10 dígitos."
        : null,
    correo: email
      ? email.length > 150
        ? "El correo no puede exceder 150 caracteres."
        : !REGEX_CORREO.test(email)
          ? "El formato del correo electrónico no es válido."
          : /@medly\./i.test(email)
            ? "No se permiten correos con dominio @medly."
            : null
      : null,
    contrasena:
      params.contrasena.length < 8 || params.contrasena.length > 72
        ? "La contraseña debe tener entre 8 y 72 caracteres."
        : !/^(?=.*[A-Za-zÁÉÍÓÚÑáéíóúñ])(?=.*\d).{8,}$/.test(
              params.contrasena,
            )
          ? "La contraseña debe incluir al menos una letra y un número."
          : null,
    confirmarContrasena:
      params.contrasena !== params.confirmarContrasena
        ? "Las contraseñas no coinciden."
        : null,
  };
}

export function validarCoherenciaCurp(params: {
  curp: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string;
}): string | null {
  const curp = normalizarCurp(params.curp);
  if (curp.length !== 18) return "La CURP debe tener 18 caracteres.";

  const paterno = params.apellidoPaterno.trim().toUpperCase();
  const materno = apellidoMaternoEfectivo(params.apellidoMaterno);
  const nombre = params.nombres.trim().toUpperCase();

  const letra1 = curp[0];
  const letra2 = curp[1];
  const letra3 = curp[2];
  const letra4 = curp[3];
  const curpFecha = curp.slice(4, 10);

  if (!paterno.startsWith(letra1)) {
    return `La CURP debe iniciar con la primera letra del apellido paterno (${paterno[0]}).`;
  }

  const vocalesPaterno = paterno.slice(1).match(/[AEIOU]/);
  const vocalEsperada = vocalesPaterno ? vocalesPaterno[0] : "X";
  if (letra2 !== vocalEsperada) {
    return `La segunda letra de la CURP debe ser la primera vocal interna del apellido paterno (${vocalEsperada}).`;
  }

  const letraTerceraEsperada = materno
    ? materno[0]
    : primeraConsonanteInterna(paterno);
  if (letra3 !== letraTerceraEsperada) {
    return materno
      ? `La tercera letra de la CURP debe ser la primera letra del apellido materno (${letraTerceraEsperada}).`
      : `Sin apellido materno, la tercera letra de la CURP debe ser la primera consonante interna del apellido paterno (${letraTerceraEsperada}).`;
  }

  const palabras = nombre.split(/[\s]+/);
  const primerNombre = palabras.find(
    (p) => p !== "JOSE" && p !== "MARIA" && p !== "MA",
  );
  const letraNombre = (primerNombre ?? palabras[0] ?? "X")[0];
  if (letra4 !== letraNombre) {
    return `La cuarta letra de la CURP debe coincidir con la primera letra del nombre (${letraNombre}).`;
  }

  const fechaDdMm = fechaNacimientoADDmmaaaa(params.fechaNacimiento);
  if (fechaDdMm) {
    const partes = fechaDdMm.split("/");
    const anio = partes[2].slice(-2);
    const mes = partes[1].padStart(2, "0");
    const dia = partes[0].padStart(2, "0");
    const fechaEsperada = `${anio}${mes}${dia}`;
    if (curpFecha !== fechaEsperada) {
      return `Los dígitos 5-10 de la CURP no coinciden con la fecha de nacimiento (${fechaEsperada}).`;
    }
  }

  return null;
}

/** Convierte DD/MM/AAAA o YYYY-MM-DD a DD/MM/AAAA para validación CURP. */
export function fechaNacimientoADDmmaaaa(fecha: string): string | null {
  const t = fecha.trim();
  if (!t) return null;
  const slash = t.split("/");
  if (slash.length === 3) return t;
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
  return null;
}

export interface PacienteCurpValidable {
  curp: string;
  nombre: string;
  apellido_pat: string;
  apellido_mat?: string | null;
  fechaNacimiento: string;
}

export function validarCurpPaciente(p: PacienteCurpValidable): string | null {
  const curp = normalizarCurp(p.curp);
  if (!REGEX_CURP.test(curp)) {
    return "La CURP del paciente no es válida (18 caracteres).";
  }
  const fecha = fechaNacimientoADDmmaaaa(String(p.fechaNacimiento).slice(0, 10));
  return validarCoherenciaCurp({
    curp,
    nombres: p.nombre,
    apellidoPaterno: p.apellido_pat,
    apellidoMaterno: p.apellido_mat ?? "",
    fechaNacimiento: fecha ?? "",
  });
}
