import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registerPaciente } from '../services/pacienteService'
import { useToast } from '../App'

export default function RegistroPaciente() {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const [form, setForm] = useState({ dni: '', nombre: '', apellido: '', telefono: '', password: '', email: '' })
  const [loading, setLoading] = useState(false)

  const validate = () => {
    if (!/^[0-9]{7,8}$/.test(form.dni)) return 'El DNI debe tener 7 u 8 dígitos'
    if (!/^[0-9]{8,20}$/.test(form.telefono)) return 'El teléfono debe tener entre 8 y 20 dígitos'
    if (form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
    if (!form.nombre.trim() || !form.apellido.trim()) return 'Nombre y apellido son obligatorios'
    return null
  }

  const handleChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
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
    <section className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h3 className="h5 fw-bold mb-3">Registro de paciente</h3>
              <form onSubmit={handleSubmit} className="d-grid gap-3">
                <input name="dni" placeholder="DNI" value={form.dni} onChange={handleChange} className="form-control" inputMode="numeric" pattern="[0-9]*" required />
                <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} className="form-control" required />
                <input name="apellido" placeholder="Apellido" value={form.apellido} onChange={handleChange} className="form-control" required />
                <input name="telefono" placeholder="Teléfono" value={form.telefono} onChange={handleChange} className="form-control" inputMode="numeric" pattern="[0-9]*" required />
                <input name="email" placeholder="Email (opcional)" value={form.email} onChange={handleChange} className="form-control" type="email" />
                <input name="password" type="password" placeholder="Contraseña" value={form.password} onChange={handleChange} className="form-control" minLength={6} required />
                <div className="d-grid"><button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Registrando...' : 'Registrar'}</button></div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
