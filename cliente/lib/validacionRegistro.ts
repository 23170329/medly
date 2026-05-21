/** CURP: 18 caracteres alfanuméricos (se normaliza a mayúsculas). */
export const REGEX_CURP = /^[A-Z0-9]{18}$/;

/** Correo con formato razonablemente estricto (RFC simplificado). */
export const REGEX_CORREO =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function normalizarCurp(curp: string): string {
  return curp.trim().toUpperCase().replace(/\s/g, "");
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
  const ap = params.apellidoPaterno.trim();
  if (ap.length < 1 || ap.length > 15) {
    return "El apellido paterno es obligatorio (máx. 15 caracteres).";
  }
  const am = params.apellidoMaterno.trim();
  if (am.length < 1 || am.length > 15) {
    return "El apellido materno es obligatorio (máx. 15 caracteres).";
  }
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
        : null,
    apellidoPaterno:
      ap.length < 1 || ap.length > 15
        ? "El apellido paterno es obligatorio (máx. 15 caracteres)."
        : null,
    apellidoMaterno:
      am.length < 1 || am.length > 15
        ? "El apellido materno es obligatorio (máx. 15 caracteres)."
        : null,
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
  if (/@medly\./i.test(email)) {
    return "No se permiten correos con dominio @medly.";
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

export function validarPasoAccesoDetallado(params: {
  telefono: string;
  correo: string;
  contrasena: string;
  confirmarContrasena: string;
}): ErroresPaso {
  const tel = params.telefono.replace(/\D/g, "");
  const email = params.correo.trim();
  return {
    telefono: tel.length !== 10 ? "El teléfono debe tener 10 dígitos." : null,
    correo:
      !email || email.length > 150
        ? "Indica un correo electrónico válido."
        : !REGEX_CORREO.test(email)
          ? "El formato del correo electrónico no es válido."
          : /@medly\./i.test(email)
            ? "No se permiten correos con dominio @medly."
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
  const materno = params.apellidoMaterno.trim().toUpperCase();
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

  const letraMaterno = materno ? materno[0] : "X";
  if (materno && letra3 !== letraMaterno) {
    return `La tercera letra de la CURP debe ser la primera letra del apellido materno (${letraMaterno}).`;
  }
  if (!materno && letra3 !== "X") {
    return "Sin apellido materno, la tercera letra de la CURP debe ser X.";
  }

  const palabras = nombre.split(/[\s]+/);
  const primerNombre = palabras.find(
    (p) => p !== "JOSE" && p !== "MARIA" && p !== "MA",
  );
  const letraNombre = (primerNombre ?? palabras[0] ?? "X")[0];
  if (letra4 !== letraNombre) {
    return `La cuarta letra de la CURP debe coincidir con la primera letra del nombre (${letraNombre}).`;
  }

  if (params.fechaNacimiento) {
    const partes = params.fechaNacimiento.split("/");
    if (partes.length === 3) {
      const anio = partes[2].slice(-2);
      const mes = partes[1].padStart(2, "0");
      const dia = partes[0].padStart(2, "0");
      const fechaEsperada = `${anio}${mes}${dia}`;
      if (curpFecha !== fechaEsperada) {
        return `Los dígitos 5-10 de la CURP no coinciden con la fecha de nacimiento (${fechaEsperada}).`;
      }
    }
  }

  return null;
}
