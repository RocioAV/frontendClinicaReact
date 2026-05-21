import { request } from './api'

export async function getEspecialidades() {
  return request('/especialidades')
}
