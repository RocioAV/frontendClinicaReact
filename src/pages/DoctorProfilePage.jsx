import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAuth, useToast } from '../App'
import { getDoctorById } from '../services/doctorService'

export default function DoctorProfilePage() {
  const { idDoctor } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, isAuthenticated } = useAuth()
  const { pushToast } = useToast()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [observaciones, setObservaciones] = useState(location.state?.observaciones || '')

  useEffect(() => {
    let active = true

    async function loadDoctor() {
      setLoading(true)
      try {
        const data = await getDoctorById(idDoctor)
        if (!active) return
        setDoctor(data)
      } catch (error) {
        pushToast({ variant: 'danger', title: 'Error', message: 'No se pudo cargar el perfil del doctor' })
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDoctor()

    return () => {
      active = false
    }
  }, [idDoctor, pushToast])

  const handleReservar = () => {
    if (!isAuthenticated || profile?._rol?.toLowerCase() !== 'paciente') {
      pushToast({ variant: 'warning', title: 'Acceso requerido', message: 'Iniciá sesión como paciente para reservar un turno' })
      navigate('/login')
      return
    }

    navigate(`/paciente/${profile._id}/turno/${idDoctor}`, {
      state: { observaciones },
    })
  }

  if (loading) {
    return (
      <section className="container py-5">
        <div className="alert alert-info">Cargando perfil del doctor...</div>
      </section>
    )
  }

  if (!doctor) {
    return (
      <section className="container py-5">
        <div className="alert alert-danger">No se encontró el doctor solicitado.</div>
      </section>
    )
  }

  return (
    <section className="container py-4 py-md-5">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-10 col-xl-8">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <button className="btn btn-outline-secondary" type="button" onClick={() => navigate(-1)}>
              <i className="bi bi-arrow-left me-2" /> Volver
            </button>
            <span className="badge bg-primary fs-6">{doctor.especialidad?.nombre || 'Sin especialidad'}</span>
          </div>

          <div className="card border-0 shadow-sm overflow-hidden">
            <div className="card-body p-4 p-md-5 text-start">
              <div className="d-flex flex-column flex-md-row align-items-md-center gap-4 mb-4">
                <div className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center" style={{ width: '96px', height: '96px' }}>
                  <i className="bi bi-person-badge fs-1" />
                </div>
                <div className="flex-grow-1">
                  <h1 className="h3 fw-bold mb-1">{doctor.nombre} {doctor.apellido}</h1>
                  <p className="text-muted mb-2">{doctor.especialidad?.nombre || 'Sin especialidad'}</p>
                  <div className="d-flex flex-wrap gap-2">
                    <span className="badge bg-success">${doctor.precioConsulta || 0}</span>
                    {doctor.activo ? <span className="badge bg-primary">Activo</span> : <span className="badge bg-secondary">Inactivo</span>}
                  </div>
                </div>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-12 col-md-6">
                  <div className="border rounded-3 p-3 h-100 bg-light">
                    <div className="text-muted small mb-1">Teléfono</div>
                    <div className="fw-semibold"><i className="bi bi-telephone me-2 text-primary" />{doctor.telefono || 'Sin teléfono'}</div>
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <div className="border rounded-3 p-3 h-100 bg-light">
                    <div className="text-muted small mb-1">Matrícula</div>
                    <div className="fw-semibold"><i className="bi bi-card-text me-2 text-primary" />{doctor.matricula || 'No informada'}</div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold">Observaciones para el turno</label>
                <textarea
                  className="form-control"
                  rows={4}
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Escribí aquí lo que quieras informar antes de reservar"
                />
                <div className="form-text">Estas observaciones se enviarán al turno al continuar con la reserva.</div>
              </div>

              <div className="d-grid d-md-flex gap-2">
                <button className="btn btn-primary btn-lg" type="button" onClick={handleReservar}>
                  <i className="bi bi-calendar-plus me-2" />Solicitar turno
                </button>
                <button className="btn btn-outline-secondary btn-lg" type="button" onClick={() => navigate('/doctores')}>
                  <i className="bi bi-search me-2" />Ver más doctores
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
