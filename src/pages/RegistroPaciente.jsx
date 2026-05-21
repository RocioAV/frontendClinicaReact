import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerPaciente } from '../services/pacienteService'
import { useToast } from '../App'

export default function RegistroPaciente() {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const [form, setForm] = useState({ dni: '', nombre: '', apellido: '', telefono: '', password: '', email: '' })
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const validate = () => {
    if (!/^[0-9]{7,8}$/.test(form.dni)) return 'El DNI debe tener 7 u 8 dígitos'
    if (!/^[0-9]{8,20}$/.test(form.telefono)) return 'El teléfono debe tener entre 8 y 20 dígitos'
    if (/[0-9]/.test(form.nombre) || /[0-9]/.test(form.apellido)) return 'El nombre y apellido no pueden contener números'
    if (form.nombre.trim().length < 2 || form.apellido.trim().length < 2) return 'Nombre y apellido deben tener al menos 2 caracteres'
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) return 'El email no es válido'
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
    password: form.password && form.password.length < 6 ? 'La contraseña debe tener al menos 6 caracteres' : '',
    confirmPassword: confirmPassword && confirmPassword !== form.password ? 'Las contraseñas no coinciden' : '',
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitted(true)
    const error = validate()
    if (error) {
      pushToast({ variant: 'warning', title: 'Validación', message: error })
      return
    }

    setLoading(true)
    try {
      await registerPaciente(form)
      pushToast({ variant: 'success', title: 'Registro', message: 'Registro completado. Iniciá sesión.' })
      navigate('/login')
    } catch (err) {
      console.error(err)
      pushToast({ variant: 'danger', title: 'Error', message: err?.message || 'No se pudo registrar' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-page py-5">
      <div className="row justify-content-center">
        <div className="col-12 col-md-10 col-lg-8 col-xl-6">
          <div className="card border-0 shadow-lg auth-card auth-card--md">
            <div className="card-body p-4 p-md-5">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="auth-icon-circle bg-primary bg-opacity-10 text-primary"><i className="bi bi-person-plus" /></div>
                <div>
                  <h3 className="h4 fw-bold mb-1">Registro de paciente</h3>
                  <p className="text-secondary mb-0">Completá tus datos para crear la cuenta</p>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="row g-3">
                <div className="col-12 col-md-6">
                  <label className="form-label fw-medium">DNI</label>
                  <input name="dni" placeholder="DNI" value={form.dni} onChange={handleChange} className={`form-control ${submitted && !/^[0-9]{7,8}$/.test(form.dni) ? 'is-invalid' : ''}`} inputMode="numeric" pattern="[0-9]*" required />
                  {fieldErrors.dni && <div className="invalid-feedback d-block">{fieldErrors.dni}</div>}
                </div>
                <div className="col-12 col-md-6">
                  <label className="form-label fw-medium">Teléfono</label>
                  <input name="telefono" placeholder="Teléfono" value={form.telefono} onChange={handleChange} className={`form-control ${submitted && !/^[0-9]{8,20}$/.test(form.telefono) ? 'is-invalid' : ''}`} inputMode="numeric" pattern="[0-9]*" required />
                  {fieldErrors.telefono && <div className="invalid-feedback d-block">{fieldErrors.telefono}</div>}
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
                <div className="col-12">
                  <label className="form-label fw-medium">Email</label>
                  <input name="email" placeholder="Email (opcional)" value={form.email} onChange={handleChange} className={`form-control ${submitted && form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) ? 'is-invalid' : ''}`} type="email" />
                  {fieldErrors.email && <div className="invalid-feedback d-block">{fieldErrors.email}</div>}
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
                  <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>{loading ? 'Registrando...' : 'Registrar'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
