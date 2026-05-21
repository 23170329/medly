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
  medico?: MedicoDto & { especialidad?: { nombre: string } };
  sucursal?: SucursalDto;
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

export async function cancelarCita(id: number): Promise<{
  mensaje: string;
  reembolsoProcesado: boolean;
}> {
  const { data } = await api.patch(`/citas/${id}/cancelar`);
  return data;
}

export async function abandonarReserva(id: number): Promise<void> {
  await api.delete(`/citas/${id}/reserva`);
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
  fechaCreacion: string;
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

export async function fetchSucursales(): Promise<SucursalDto[]> {
  const { data } = await api.get<SucursalDto[]>("/sucursal");
  return Array.isArray(data) ? data : [];
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
