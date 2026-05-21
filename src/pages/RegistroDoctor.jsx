import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { request } from '../services/api'
import { useToast } from '../App'
import { getEspecialidades } from '../services/especialidadService'

export default function RegistroDoctor() {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const [form, setForm] = useState({ dni: '', nombre: '', apellido: '', telefono: '', password: '', email: '', matricula: '', especialidad: '', precioConsulta: '' })
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
    if (!form.matricula.trim()) return 'La matrícula es obligatoria'
    if (!form.especialidad.trim()) return 'Debes seleccionar una especialidad'
    if (!form.precioConsulta || Number.isNaN(Number(form.precioConsulta))) return 'El precio de consulta debe ser un número'
    if (form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
    return null
  }

  const handleChange = (e) => setForm((s) => ({ ...s, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
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
    <section className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h3 className="h5 fw-bold mb-3">Registro de doctor</h3>
              <form onSubmit={handleSubmit} className="d-grid gap-3">
                <input name="dni" placeholder="DNI" value={form.dni} onChange={handleChange} className="form-control" inputMode="numeric" required />
                <input name="nombre" placeholder="Nombre" value={form.nombre} onChange={handleChange} className="form-control" required />
                <input name="apellido" placeholder="Apellido" value={form.apellido} onChange={handleChange} className="form-control" required />
                <input name="telefono" placeholder="Teléfono" value={form.telefono} onChange={handleChange} className="form-control" inputMode="numeric" pattern="[0-9]*" required />
                <input name="email" placeholder="Email" value={form.email} onChange={handleChange} className="form-control" type="email" />
                <input name="matricula" placeholder="Matrícula" value={form.matricula} onChange={handleChange} className="form-control" required />
                <select name="especialidad" value={form.especialidad} onChange={handleChange} className="form-select" required disabled={loadingEspecialidades}>
                  <option value="">{loadingEspecialidades ? 'Cargando especialidades...' : 'Seleccione una especialidad'}</option>
                  {especialidades.map((especialidad) => (
                    <option key={especialidad._id} value={especialidad._id}>{especialidad.nombre}</option>
                  ))}
                </select>
                <input name="precioConsulta" placeholder="Precio" value={form.precioConsulta} onChange={handleChange} className="form-control" type="number" min="0" step="1" />
                <input name="password" type="password" placeholder="Contraseña" value={form.password} onChange={handleChange} className="form-control" minLength={6} required />
                <div className="d-grid"><button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Registrar doctor'}</button></div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
