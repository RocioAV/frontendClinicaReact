import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { request } from '../services/api'

export default function EspecialidadesPage() {
  const navigate = useNavigate()
  const [especialidades, setEspecialidades] = useState([])
  const [doctores, setDoctores] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [espData, doctoresData] = await Promise.all([request('/especialidades'), request('/doctores')])
        if (!active) return
        setEspecialidades(espData || [])
        setDoctores(doctoresData || [])
      } catch (err) {
        if (active) setError(err?.message || 'Error al cargar especialidades')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  const getDoctoresByEspecialidad = (idEspecialidad) => doctores.filter((doctor) => doctor.especialidad?._id === idEspecialidad)

  const getNombreCompleto = (doctor) => `${doctor.nombre} ${doctor.apellido}`

  return (
    <section className="container py-5">
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold text-dark mb-3">Nuestras Especialidades Médicas</h1>
        <p className="lead text-muted">Contamos con profesionales especializados en diferentes áreas de la salud</p>
      </div>

      {loading && <div className="text-center py-5"><div className="spinner-border text-primary" role="status" /><p className="mt-3 text-muted">Cargando especialidades...</p></div>}
      {error && !loading && <div className="alert alert-danger d-flex align-items-center justify-content-between"><div><strong>Error:</strong> {error}</div><button className="btn btn-outline-danger btn-sm" onClick={() => window.location.reload()}><i className="bi bi-arrow-clockwise me-1" />Reintentar</button></div>}

      {!loading && !error && especialidades.length > 0 && (
        <div className="row g-4">
          {especialidades.map((especialidad) => {
            const especialistas = getDoctoresByEspecialidad(especialidad._id)
            return (
              <div className="col-12" key={especialidad._id}>
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-start mb-3">
                      <div className="flex-shrink-0 me-3">
                        <div className="bg-primary bg-gradient rounded-circle p-3 text-white">
                          <i className="bi bi-hospital fs-4" />
                        </div>
                      </div>
                      <div className="flex-grow-1">
                        <h3 className="card-title fw-bold text-dark mb-2">{especialidad.nombre}</h3>
                        {especialidad.descripcion && <p className="text-muted mb-3">{especialidad.descripcion}</p>}
                        <div className="d-flex align-items-center">
                          <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3 py-2">
                            <i className="bi bi-people me-1" />
                            {especialistas.length} {especialistas.length === 1 ? 'Profesional' : 'Profesionales'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h6 className="text-muted mb-3 fw-semibold"><i className="bi bi-person-badge me-2" />Profesionales Disponibles</h6>
                      <div className="row g-3">
                        {especialistas.map((doctor) => (
                          <div className="col-md-6" key={doctor._id}>
                            <div className="d-flex align-items-center p-3 bg-light rounded-3 border">
                              <div className="flex-shrink-0 me-3">
                                <div className="bg-white rounded-circle p-2 shadow-sm">
                                  <i className="bi bi-person-circle text-primary fs-5" />
                                </div>
                              </div>
                              <div className="flex-grow-1 text-start">
                                <h6 className="mb-1 fw-semibold text-dark">{getNombreCompleto(doctor)}</h6>
                                <small className="text-muted"><i className="bi bi-geo-alt me-1" />Consultorio {especialidad.nombre}</small>
                              </div>
                              <div className="flex-shrink-0">
                                <button className="btn btn-outline-primary btn-sm" type="button" onClick={() => navigate(`/doctores/${doctor._id}`)} title="Ver perfil del profesional">
                                  <i className="bi bi-eye" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-top">
                      <div className="d-flex justify-content-between align-items-center">
                        <small className="text-muted"><i className="bi bi-clock me-1" />Horarios de atención disponibles</small>
                        <div className="d-flex gap-2">
                          <button className="btn btn-outline-primary" type="button" onClick={() => navigate('/doctores')} title={`Ver profesionales en ${especialidad.nombre}`}>
                            <i className="bi bi-eye me-2" />Ver profesionales
                          </button>
                          
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!loading && !error && especialidades.length === 0 && (
        <div className="text-center py-5">
          <div className="mb-4"><i className="bi bi-hospital display-1 text-muted opacity-50" /></div>
          <h3 className="fw-bold text-muted mb-3">No hay especialidades disponibles</h3>
          <p className="text-muted mb-4">Estamos trabajando para incorporar más profesionales y especialidades médicas.</p>
          <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>
            <i className="bi bi-arrow-clockwise me-2" />Actualizar Lista
          </button>
        </div>
      )}
    </section>
  )
}
