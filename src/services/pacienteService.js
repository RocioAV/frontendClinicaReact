import { request } from './api'

export async function getPaciente(id) {
  return request(`/pacientes/${id}`)
}

export async function registerPaciente(data) {
  return request('/pacientes/registro', { method: 'POST', body: data })
}

export async function updatePaciente(id, data) {
  return request(`/pacientes/${id}`, { method: 'PUT', body: data })
}

export async function getPacienteByDni(dni) {
  return request(`/pacientes/dni/${encodeURIComponent(dni)}`)
}

export async function desvincularGoogle(id) {
  return request(`/pacientes/desvincular/${id}`, { method: 'PUT' })
}
