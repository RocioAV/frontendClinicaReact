import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDoctores, getDoctoresByEspecialidad, getDoctoresByName } from '../services/doctorService'
import { getEspecialidades } from '../services/especialidadService'

export default function ListDoctoresPage() {
  const navigate = useNavigate()
  const [doctores, setDoctores] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [busquedaNombre, setBusquedaNombre] = useState('')
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [doctoresData, especialidadesData] = await Promise.all([getDoctores(), getEspecialidades()])
        if (!active) return
        setDoctores(doctoresData || [])
        setEspecialidades(especialidadesData || [])
      } catch (err) {
        if (active) setError(err?.message || 'Error al cargar doctores')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  const cargarDoctores = async (nombre = '', especialidad = '') => {
    setLoading(true)
    setError('')

    try {
      if (nombre.trim() === '' && especialidad.trim() === '') {
        const doctoresData = await getDoctores()
        setDoctores(Array.isArray(doctoresData) ? doctoresData : [])
      } else if (nombre.trim() !== '' && especialidad.trim() === '') {
        const doctoresData = await getDoctoresByName(nombre)
        setDoctores(Array.isArray(doctoresData) ? doctoresData : [])
      } else if (nombre.trim() === '' && especialidad.trim() !== '') {
        const doctoresData = await getDoctoresByEspecialidad(especialidad)
        setDoctores(Array.isArray(doctoresData) ? doctoresData : [])
      } else {
        const doctoresData = await getDoctoresByName(nombre)
        const lista = Array.isArray(doctoresData) ? doctoresData : []
        setDoctores(lista.filter((doctor) => doctor.especialidad?._id === especialidad))
      }
    } catch (err) {
      setError(err?.message || 'Error al cargar doctores')
    } finally {
      setLoading(false)
    }
  }

  const onBuscarNombre = () => {
    cargarDoctores(busquedaNombre, filtroEspecialidad)
  }

  const onFiltrarEspecialidad = (value) => {
    setFiltroEspecialidad(value)
    cargarDoctores(busquedaNombre, value)
  }

  const doctoresFiltrados = doctores

  return (
    <section className="container py-4">
      <div className="row mb-4 align-items-end g-3">
        <div className="col-12 col-md-6">
          <label htmlFor="busqueda" className="form-label fw-semibold">Buscar por nombre</label>
          <div className="input-group">
            <input id="busqueda" type="text" className="form-control" placeholder="Nombre del doctor" value={busquedaNombre} onChange={(e) => setBusquedaNombre(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onBuscarNombre()} />
            <button className="btn btn-outline-primary" type="button" onClick={onBuscarNombre}>
              <i className="bi bi-search" /> Buscar
            </button>
          </div>
        </div>
        <div className="col-12 col-md-6">
          <label htmlFor="especialidad" className="form-label fw-semibold">Filtrar por especialidad</label>
          <select id="especialidad" className="form-select" value={filtroEspecialidad} onChange={(e) => onFiltrarEspecialidad(e.target.value)}>
            <option value="">Todas las especialidades</option>
            {especialidades.map((esp) => (
              <option key={esp._id} value={esp._id}>{esp.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <div className="alert alert-info">Cargando doctores...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-4">
        {doctoresFiltrados.map((doctor) => (
          <div className="col-12 col-sm-6 col-lg-4" key={doctor._id}>
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body d-flex flex-column">
                <div className="d-flex align-items-center mb-3">
                  <i className="bi bi-person-circle fs-1 text-primary me-3" />
                  <div>
                    <h5 className="card-title mb-0">{doctor.nombre} {doctor.apellido}</h5>
                    <span className="badge bg-secondary">{doctor.especialidad?.nombre || 'Sin especialidad'}</span>
                  </div>
                </div>
                <ul className="list-unstyled mb-4 flex-grow-1 text-start">
                  <li className="mb-2"><i className="bi bi-cash-coin me-2 text-success" /> <strong>Precio:</strong> ${doctor.precioConsulta}</li>
                  <li className="mb-2"><i className="bi bi-telephone me-2 text-info" /> <strong>Contacto:</strong> {doctor.telefono || 'Sin teléfono'}</li>
                </ul>
                <button className="btn btn-primary w-100 mt-auto" type="button" onClick={() => navigate(`/doctores/${doctor._id}`)}>
                  <i className="bi bi-eye me-2" />Ver perfil
                </button>
              </div>
            </div>
          </div>
        ))}
        {!loading && doctores.length === 0 && (
          <div className="col-12">
            <div className="alert alert-warning text-center">No hay doctores cargados en el sistema.</div>
          </div>
        )}
        {!loading && doctores.length > 0 && doctoresFiltrados.length === 0 && (
          <div className="col-12">
            <div className="alert alert-info text-center">No se encontraron doctores con los filtros seleccionados.</div>
          </div>
        )}
      </div>
    </section>
  )
}
