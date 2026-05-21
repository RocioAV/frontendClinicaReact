import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { request } from '../services/api'
import { useToast } from '../App'
import { getEspecialidades } from '../services/especialidadService'

export default function RegistroDoctor() {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const [form, setForm] = useState({ dni: '', nombre: '', apellido: '', telefono: '', password: '', email: '', matricula: '', especialidad: '', precioConsulta: '' })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [especialidades, setEspecialidades] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingEspecialidades, setLoadingEspecialidades] = useState(true)

  useEffect(() => {
    let active = true

    async function loadEspecialidades() {
      setLoadingEspecialidades(true)
      try {
        const data = await getEspecialidades()
        if (!active) return
        setEspecialidades(Array.isArray(data) ? data : [])
      } catch (error) {
        if (active) {
          pushToast({ variant: 'danger', title: 'Error', message: 'No se pudieron cargar las especialidades' })
        }
      } finally {
        if (active) setLoadingEspecialidades(false)
      }
    }

    loadEspecialidades()

    return () => {
      active = false
    }
  }, [pushToast])

  const validate = () => {
    if (!/^[0-9]{7,8}$/.test(form.dni)) return 'El DNI debe tener 7 u 8 dígitos'
    if (!/^[0-9]{8,20}$/.test(form.telefono)) return 'El teléfono debe tener entre 8 y 20 dígitos'
    if (/[0-9]/.test(form.nombre) || /[0-9]/.test(form.apellido)) return 'El nombre y apellido no pueden contener números'
    if (form.nombre.trim().length < 2 || form.apellido.trim().length < 2) return 'Nombre y apellido deben tener al menos 2 caracteres'
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'El email no es válido'
    if (!form.matricula.trim()) return 'La matrícula es obligatoria'
    if (!form.especialidad.trim()) return 'Debes seleccionar una especialidad'
    if (!form.precioConsulta || Number.isNaN(Number(form.precioConsulta))) return 'El precio de consulta debe ser un número'
    if (Number(form.precioConsulta) <= 0) return 'El precio de consulta debe ser mayor a 0'
    if (form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
    if (form.password !== confirmPassword) return 'Las contraseñas no coinciden'
    return null
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    const nextValue = (name === 'nombre' || name === 'apellido') ? value.replace(/[0-9]/g, '') : value
    setForm((s) => ({ ...s, [name]: nextValue }))
  }

  const fieldErrors = {
    dni: form.dni && !/^[0-9]{7,8}$/.test(form.dni) ? 'El DNI debe tener 7 u 8 dígitos' : '',
    telefono: form.telefono && !/^[0-9]{8,20}$/.test(form.telefono) ? 'El teléfono debe tener entre 8 y 20 dígitos' : '',
    nombre: form.nombre && (/[0-9]/.test(form.nombre) || form.nombre.trim().length < 2) ? 'El nombre debe tener al menos 2 letras y sin números' : '',
    apellido: form.apellido && (/[0-9]/.test(form.apellido) || form.apellido.trim().length < 2) ? 'El apellido debe tener al menos 2 letras y sin números' : '',
    email: form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? 'El email no es válido' : '',
    matricula: form.matricula.trim() ? '' : 'La matrícula es obligatoria',
    especialidad: form.especialidad.trim() ? '' : 'Debes seleccionar una especialidad',
    precioConsulta: !form.precioConsulta || Number.isNaN(Number(form.precioConsulta)) || Number(form.precioConsulta) <= 0 ? 'El precio debe ser mayor a 0' : '',
    password: form.password && form.password.length < 6 ? 'La contraseña debe tener al menos 6 caracteres' : '',
    confirmPassword: confirmPassword && confirmPassword !== form.password ? 'Las contraseñas no coinciden' : '',
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitted(true)
    const err = validate()
    if (err) { pushToast({ variant: 'warning', title: 'Validación', message: err }); return }

    setLoading(true)
    try {
      await request('/doctores', {
        method: 'POST',
        body: {
          ...form,
          precioConsulta: Number(form.precioConsulta),
        },
      })
      pushToast({ variant: 'success', title: 'Registro', message: 'Registro de doctor enviado. Requiere revisión de admin.' })
      navigate('/login')
    } catch (err) {
      console.error(err)
      pushToast({ variant: 'danger', title: 'Error', message: err?.message || 'No se pudo registrar el doctor' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-page py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-11 col-xl-8">
          <div className="card border-0 shadow-lg auth-card auth-card--lg">
            <div className="card-body p-4 p-md-5">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="auth-icon-circle bg-primary bg-opacity-10 text-primary"><i className="bi bi-person-badge" /></div>
                <div>
                  <h3 className="h4 fw-bold mb-1">Registro de doctor</h3>
                  <p className="text-secondary mb-0">Completá los datos profesionales y de acceso</p>
                </div>
              </div>
              <div className="mb-3">
                <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/admin')}><i className="bi bi-arrow-left me-2" />Volver al panel</button>
              </div>
              <form onSubmit={handleSubmit} className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label fw-medium">DNI</label>
                  <input name="dni" placeholder="DNI" value={form.dni} onChange={handleChange} className={`form-control ${submitted && !/^[0-9]{7,8}$/.test(form.dni) ? 'is-invalid' : ''}`} inputMode="numeric" required />
                  {fieldErrors.dni && <div className="invalid-feedback d-block">{fieldErrors.dni}</div>}
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-medium">Matrícula</label>
                  <input name="matricula" placeholder="Matrícula" value={form.matricula} onChange={handleChange} className={`form-control ${submitted && !form.matricula.trim() ? 'is-invalid' : ''}`} required />
                  {fieldErrors.matricula && <div className="invalid-feedback d-block">{fieldErrors.matricula}</div>}
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-medium">Nombre</label>
                  <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} className={`form-control ${submitted && form.nombre.trim().length < 2 ? 'is-invalid' : ''}`} required />
                  {fieldErrors.nombre && <div className="invalid-feedback d-block">{fieldErrors.nombre}</div>}
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-medium">Apellido</label>
                  <input name="apellido" placeholder="Apellido" value={form.apellido} onChange={handleChange} className={`form-control ${submitted && form.apellido.trim().length < 2 ? 'is-invalid' : ''}`} required />
                  {fieldErrors.apellido && <div className="invalid-feedback d-block">{fieldErrors.apellido}</div>}
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-medium">Teléfono</label>
                  <input name="telefono" placeholder="Teléfono" value={form.telefono} onChange={handleChange} className={`form-control ${submitted && !/^[0-9]{8,20}$/.test(form.telefono) ? 'is-invalid' : ''}`} inputMode="numeric" pattern="[0-9]*" required />
                  {fieldErrors.telefono && <div className="invalid-feedback d-block">{fieldErrors.telefono}</div>}
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-medium">Precio de consulta</label>
                  <input name="precioConsulta" placeholder="Precio" value={form.precioConsulta} onChange={handleChange} className={`form-control ${submitted && (!form.precioConsulta || Number(form.precioConsulta) <= 0 || Number.isNaN(Number(form.precioConsulta))) ? 'is-invalid' : ''}`} type="number" min="0" step="1" />
                  {fieldErrors.precioConsulta && <div className="invalid-feedback d-block">{fieldErrors.precioConsulta}</div>}
                </div>
                <div className="col-12">
                  <label className="form-label fw-medium">Email</label>
                  <input name="email" placeholder="Email" value={form.email} onChange={handleChange} className={`form-control ${submitted && form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? 'is-invalid' : ''}`} type="email" />
                  {fieldErrors.email && <div className="invalid-feedback d-block">{fieldErrors.email}</div>}
                </div>
                <div className="col-12">
                  <label className="form-label fw-medium">Especialidad</label>
                  <select name="especialidad" value={form.especialidad} onChange={handleChange} className={`form-select ${submitted && !form.especialidad.trim() ? 'is-invalid' : ''}`} required disabled={loadingEspecialidades}>
                    <option value="">{loadingEspecialidades ? 'Cargando especialidades...' : 'Seleccione una especialidad'}</option>
                    {especialidades.map((especialidad) => (
                      <option key={especialidad._id} value={especialidad._id}>{especialidad.nombre}</option>
                    ))}
                  </select>
                  {fieldErrors.especialidad && <div className="invalid-feedback d-block">{fieldErrors.especialidad}</div>}
                </div>
                <div className="col-12">
                  <label className="form-label fw-medium">Contraseña</label>
                  <input name="password" type="password" placeholder="Contraseña" value={form.password} onChange={handleChange} className={`form-control ${submitted && form.password.length < 6 ? 'is-invalid' : ''}`} minLength={6} required />
                  {fieldErrors.password && <div className="invalid-feedback d-block">{fieldErrors.password}</div>}
                </div>
                <div className="col-12">
                  <label className="form-label fw-medium">Repetir contraseña</label>
                  <input type="password" placeholder="Repetir contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`form-control ${submitted && confirmPassword !== form.password ? 'is-invalid' : ''}`} minLength={6} required />
                  {fieldErrors.confirmPassword && <div className="invalid-feedback d-block">{fieldErrors.confirmPassword}</div>}
                </div>
                <div className="col-12 d-grid pt-2">
                  <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Registrar doctor'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
