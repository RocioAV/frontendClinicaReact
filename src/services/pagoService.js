import { request } from './api'

export async function createPreference(idDoctor, idTurno, body) {
  return request(`/mercadoPago/crear-preferencia/${idDoctor}/turno/${idTurno}`, { method: 'POST', body })
}
