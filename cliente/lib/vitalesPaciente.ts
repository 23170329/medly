export function validarPesoAltura(pesoStr: string, alturaStr: string): {
  pesoKg: number | null;
  alturaM: number | null;
  errorPeso: string | null;
  errorAltura: string | null;
} {
  const pesoKg = parseFloat(pesoStr.replace(",", "."));
  const alturaM = parseFloat(alturaStr.replace(",", "."));

  let errorPeso: string | null = null;
  let errorAltura: string | null = null;

  if (!pesoStr.trim() || Number.isNaN(pesoKg)) {
    errorPeso = "Indica el peso en kilogramos.";
  } else if (pesoKg < 1 || pesoKg > 500) {
    errorPeso = "Peso válido: entre 1 y 500 kg.";
  }

  if (!alturaStr.trim() || Number.isNaN(alturaM)) {
    errorAltura = "Indica la altura en metros (ej. 1.80).";
  } else if (alturaM < 0.5 || alturaM > 2.5) {
    errorAltura = "Altura válida: entre 0.50 y 2.50 m.";
  }

  return {
    pesoKg: errorPeso ? null : pesoKg,
    alturaM: errorAltura ? null : alturaM,
    errorPeso,
    errorAltura,
  };
}

export function pesoAlturaDesdePaciente(pac?: {
  pesoKg?: number | string | null;
  alturaM?: number | string | null;
}): { peso: string; altura: string } {
  const peso = pac?.pesoKg != null ? String(pac.pesoKg) : "";
  const altura = pac?.alturaM != null ? String(pac.alturaM) : "";
  return { peso, altura };
}
