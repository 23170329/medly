/** Normaliza lo que el usuario escribe para login (correo, CURP o teléfono). */
export function normalizarIdentificadorLogin(raw: string): string {
  const id = raw.trim();
  if (!id) return id;
  if (id.includes("@")) {
    return id.toLowerCase();
  }
  const soloAlfanum = id.replace(/\s/g, "").toUpperCase();
  if (soloAlfanum.length >= 16 && soloAlfanum.length <= 18 && /^[A-Z0-9]+$/.test(soloAlfanum)) {
    return soloAlfanum;
  }
  const digitos = id.replace(/\D/g, "");
  if (digitos.length >= 10) {
    if (digitos.length === 12 && digitos.startsWith("52")) {
      return digitos.slice(2);
    }
    if (digitos.length === 13 && digitos.startsWith("521")) {
      return digitos.slice(3);
    }
    return digitos;
  }
  return id;
}

export function tipoIdentificadorLogin(
  id: string,
): "correo" | "curp" | "telefono" | "otro" {
  if (id.includes("@")) return "correo";
  if (id.length >= 16 && id.length <= 18 && /^[A-Z0-9]+$/.test(id)) return "curp";
  if (/^\d{10,13}$/.test(id)) return "telefono";
  return "otro";
}
