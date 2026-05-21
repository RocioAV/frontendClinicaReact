import { request } from './api'

export async function getDoctorById(idDoctor) {
  return request(`/doctores/${idDoctor}`)
}

export async function getDoctores() {
  return request('/doctores')
}

export async function getDoctoresByName(nombre) {
  return request(`/doctores/name?nombre=${encodeURIComponent(nombre)}`)
}

export async function getDoctoresByEspecialidad(idEspecialidad) {
  return request(`/doctores/especialidad/${encodeURIComponent(idEspecialidad)}`)
}

export async function actualizarDoctor(idDoctor, body) {
  return request(`/doctores/${idDoctor}`, { method: 'PUT', body })
}

export async function desactivarDoctor(idDoctor) {
  return request(`/doctores/${idDoctor}`, { method: 'DELETE' })
}
