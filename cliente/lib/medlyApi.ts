import api from "./apiCliente";

export interface EspecialidadDto {
  especialidadID: number;
  nombre: string;
  icono: string | null;
}

export interface MedicoDto {
  medicoID: number;
  nombre: string;
  apellidoPat: string;
  apellidoMat: string | null;
  precioConsulta: string;
  promedioCalificacion: string;
  totalResenas: number;
  especialidadID: number;
  especialidad?: { nombre: string };
}

export interface SucursalDto {
  sucursalID: number;
  nombre: string;
  direccion: string;
  telefono: string;
  capacidadConsultorios: number;
  latitud?: number | null;
  longitud?: number | null;
}

export interface MedicoSucursalDto {
  medicoID: number;
  sucursalID: number;
  sucursal: SucursalDto;
}

export interface SlotDto {
  slotID: number;
  medicoID: number;
  sucursalID: number;
  inicio: string;
  fin: string;
  estado: string;
}

export type EstadoCitaApi =
  | "PENDIENTE_PAGO"
  | "ANTICIPO_REALIZADO"
  | "CONFIRMADA"
  | "CANCELADA"
  | "COMPLETADA";

export interface PagoDto {
  pagoID: number;
  citaID: number;
  monto: string;
  tipo: "ANTICIPO_50" | "REEMBOLSO";
  estado: "PENDIENTE" | "COMPLETADO" | "FALLIDO";
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
}

export interface CitaDto {
  citaID: number;
  pacienteID: number;
  medicoID: number;
  sucursalID: number;
  slotID: number;
  inicio: string;
  fin: string;
  estado: EstadoCitaApi;
  montoTotal: string;
  montoAnticipo: string;
  causaCancelacion?: string | null;
  motivoCancelacion?: string | null;
  medico?: MedicoDto & { especialidad?: { nombre: string } };
  sucursal?: SucursalDto;
  slot?: {
    slotID: number;
    consultorio?: { numeroConsultorio: string } | null;
  };
  pagos?: PagoDto[];
}

export async function fetchEspecialidades(): Promise<EspecialidadDto[]> {
  const { data } = await api.get<EspecialidadDto[]>("/especialidades");
  return data;
}

export async function fetchMedicos(params: {
  especialidadId?: number;
  sucursalId?: number;
  q?: string;
}): Promise<MedicoDto[]> {
  const { data } = await api.get<MedicoDto[]>("/medicos", { params });
  return data;
}

export async function fetchMedicoSucursales(
  medicoId: number,
): Promise<MedicoSucursalDto[]> {
  const { data } = await api.get<MedicoSucursalDto[]>(
    `/medicos/${medicoId}/sucursales`,
  );
  return data;
}

export async function fetchMedico(medicoId: number): Promise<MedicoDto> {
  const { data } = await api.get<MedicoDto>(`/medicos/${medicoId}`);
  return data;
}

export async function fetchSlots(params: {
  medicoId: number;
  sucursalId: number;
  desde?: string;
  hasta?: string;
}): Promise<SlotDto[]> {
  const { data } = await api.get<SlotDto[]>("/horarios/disponibles", {
    params: {
      medicoId: params.medicoId,
      sucursalId: params.sucursalId,
      desde: params.desde,
      hasta: params.hasta,
    },
  });
  return data;
}

export async function crearCita(slotID: number): Promise<CitaDto> {
  const { data } = await api.post<CitaDto>("/citas", { slotID });
  return data;
}

export async function fetchMisCitas(): Promise<CitaDto[]> {
  const { data } = await api.get<CitaDto[]>("/citas/mis-citas");
  return data;
}

export async function fetchProximaCita(): Promise<CitaDto | null> {
  const { data } = await api.get<CitaDto | null>("/citas/proxima");
  return data;
}

export async function fetchCita(id: number): Promise<CitaDto> {
  const { data } = await api.get<CitaDto>(`/citas/${id}`);
  return data;
}

export async function cancelarCita(
  id: number,
  body?: { motivo?: string },
): Promise<{
  cita: CitaDto;
  mensaje: string;
  reembolsoProcesado: boolean;
}> {
  const { data } = await api.patch(`/citas/${id}/cancelar`, body ?? {});
  return data;
}

/** @deprecated Preferir cancelarCita; mantiene DELETE por compatibilidad */
export async function abandonarReserva(
  id: number,
  body?: { motivo?: string },
): Promise<{ cita: CitaDto; mensaje: string }> {
  const { data } = await api.delete(`/citas/${id}/reserva`, { data: body ?? {} });
  return data;
}

export async function marcarAnticipoRealizado(citaID: number): Promise<{
  citaID: number;
  estado: EstadoCitaApi;
}> {
  const { data } = await api.post(`/pagos/anticipo-realizado`, { citaID });
  return data;
}

export async function crearCheckoutSession(citaID: number): Promise<{
  url: string | null;
  sessionId: string;
}> {
  const { data } = await api.post(`/pagos/checkout-session`, { citaID });
  return data;
}

export interface NotificacionDto {
  notificacionID: number;
  pacienteID: number;
  titulo: string;
  mensaje: string;
  leida: boolean;
  tipo?: string | null;
  citaID?: number | null;
  medicoID?: number | null;
  sucursalID?: number | null;
  permiteReagendar?: boolean;
  motivoCancelacion?: string | null;
  canceladaPorMedico?: boolean;
  fechaCreacion: string;
}

export interface ResultadoClinicoDto {
  consultaID: number;
  fechaRegistro: string;
  diagnosticos?: string | null;
  estudiosLaboratorio?: string | null;
  tratamiento?: string | null;
  medico?: {
    nombre: string;
    apellidoPat: string;
    especialidad?: { nombre: string };
  };
}

export async function fetchNotificaciones(): Promise<NotificacionDto[]> {
  const { data } = await api.get<NotificacionDto[]>("/notificaciones");
  return data;
}

export async function fetchNotificacionesNoLeidas(): Promise<number> {
  const { data } = await api.get<number>("/notificaciones/no-leidas");
  return data;
}

export async function marcarNotificacionLeida(
  id: number,
): Promise<NotificacionDto> {
  const { data } = await api.patch<NotificacionDto>(
    `/notificaciones/${id}/leida`,
  );
  return data;
}

export async function eliminarNotificacion(id: number): Promise<void> {
  await api.delete(`/notificaciones/${id}`);
}

export async function enviarCalificacion(body: {
  citaID: number;
  estrellas: number;
  comentario?: string;
}): Promise<{ calificacionID: number; medicoID: number; estrellas: number }> {
  const { data } = await api.post("/calificaciones", body);
  return data;
}

export async function fetchEstadoCalificacionCita(
  citaId: number,
): Promise<{ calificada: boolean }> {
  const { data } = await api.get<{ calificada: boolean }>(
    `/calificaciones/cita/${citaId}/estado`,
  );
  return data;
}

export interface ResenaDoctorDto {
  calificacionID: number;
  pacienteID: number;
  medicoID: number;
  citaID: number;
  estrellas: number;
  comentario: string | null;
  fechaCalificacion: string;
  paciente?: {
    pacienteID: number;
    nombre: string;
    apellido_pat: string;
    apellido_mat?: string | null;
  };
}

export async function fetchResenasDoctor(
  medicoId: number,
): Promise<ResenaDoctorDto[]> {
  const { data } = await api.get<ResenaDoctorDto[]>(
    `/calificaciones/medico/${medicoId}`,
  );
  return data;
}

export async function fetchResultadosPaciente(
  tipo: "diagnostico" | "laboratorio",
): Promise<ResultadoClinicoDto[]> {
  const { data } = await api.get<ResultadoClinicoDto[]>(
    "/paciente/resultados",
    { params: { tipo } },
  );
  return data;
}

export async function fetchHistorialPaciente(): Promise<CitaDto[]> {
  const { data } = await api.get<CitaDto[]>("/citas/historial");
  return data;
}

export async function fetchHistorialDetallePaciente(id: number): Promise<{
  cita: CitaDto;
  consulta: Record<string, unknown> | null;
}> {
  const { data } = await api.get(`/citas/historial/${id}`);
  return data;
}

export async function fetchSucursales(): Promise<SucursalDto[]> {
  const rutas = ["/sucursal", "/sucursales"];
  for (const ruta of rutas) {
    try {
      const { data } = await api.get<SucursalDto[]>(ruta);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {
      /* siguiente ruta */
    }
  }
  return [];
}

export async function fetchEstadisticasPerfil(): Promise<{
  total: number;
  completadas: number;
  proximas: number;
}> {
  const { data } = await api.get(`/citas/estadisticas`);
  return data;
}

export interface PerfilPacienteDto {
  pacienteID: number;
  nombre: string;
  apellido_pat: string;
  apellido_mat: string | null;
  apellido: string;
  correoElectronico: string;
  telefono: string;
  fechaNacimiento: string;
  genero: string;
  curp: string;
}

export async function fetchPerfilPaciente(): Promise<PerfilPacienteDto> {
  const { data } = await api.get<PerfilPacienteDto>("/usuarios/perfil");
  return data;
}

export async function actualizarPerfilPaciente(body: {
  nombre?: string;
  apellido_pat?: string;
  apellido_mat?: string;
  correoElectronico?: string;
  telefono?: string;
}): Promise<PerfilPacienteDto> {
  const { data } = await api.patch<PerfilPacienteDto>("/usuarios/perfil", body);
  return data;
}
