import { request } from './api'

export async function createTurno(pacienteId, doctorId, payload) {
  return request(`/turnos/paciente/${pacienteId}/doctor/${doctorId}`, { method: 'POST', body: payload })
}

export async function getTurnosByPaciente(pacienteId) {
  return request(`/turnos/paciente/${pacienteId}`)
}

export async function getTurnosByEstado(estado, pacienteId) {
  return request(`/turnos/estado/${encodeURIComponent(estado)}/paciente/${encodeURIComponent(pacienteId)}`)
}

export async function getTurnoById(idTurno) {
  return request(`/turnos/${idTurno}`)
}

export async function getAllTurnos() {
  return request('/turnos')
}

export async function getTurnosPendientes() {
  return request('/turnos/estado/pendiente')
}

export async function getTurnosByFecha(fecha) {
  return request(`/turnos/fecha?fecha=${encodeURIComponent(fecha)}`)
}

export async function getTurnosByDoctor(doctorId) {
  return request(`/turnos/doctor/${doctorId}`)
}

export async function getTurnosByDoctorFecha(doctorId, fecha) {
  return request(`/turnos/doctor/${encodeURIComponent(doctorId)}/fecha?fecha=${encodeURIComponent(fecha)}`)
}

export async function cancelTurno(idTurno) {
  return request(`/turnos/${idTurno}/cancelado`, { method: 'PUT' })
}

export async function marcarRealizado(idTurno) {
  return request(`/turnos/${idTurno}/realizado`, { method: 'PUT' })
}

export async function confirmarTurno(idTurno) {
  return request(`/turnos/${idTurno}/confirmado`, { method: 'PUT' })
}

export async function actualizarDetallesTurno(idTurno, body) {
  return request(`/turnos/${idTurno}`, { method: 'PUT', body })
}
