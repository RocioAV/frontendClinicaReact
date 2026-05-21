import { request } from './api'

export async function subirArchivoMetadata(idTurno, { tipo, url, nombre }) {
  return request(`/archivos/${idTurno}`, { method: 'POST', body: { tipo, url, nombre } })
}

export async function eliminarArchivo(idArchivo) {
  return request(`/archivos/${idArchivo}`, { method: 'DELETE' })
}
