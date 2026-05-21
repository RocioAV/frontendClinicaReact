import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth, useToast } from '../App'

export default function SolicitarDniGooglePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const auth = useAuth()
  const { pushToast } = useToast()
  const [dni, setDni] = useState('')
  const [loading, setLoading] = useState(false)

  const state = location.state || {}
  const googleUser = state.googleUser || {}

  useEffect(() => {
    if (!state?.token || !state?.userData) {
      pushToast({ variant: 'warning', title: 'Atención', message: 'Faltan datos de Google. Volvé a iniciar sesión.' })
    }
  }, [pushToast, state?.token, state?.userData])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      const response = await auth.vincularDni({
        dni,
        email: googleUser.email,
        name: googleUser.displayName,
        user_id: googleUser.uid,
      })

      if (response?.token) {
        await auth.setSession(response.token)
      }

      pushToast({ variant: 'success', title: 'Éxito', message: 'DNI vinculado correctamente' })
      navigate('/')
    } catch (error) {
      pushToast({ variant: 'danger', title: 'Error', message: error?.message || 'No se pudo vincular el DNI' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="d-flex justify-content-center align-items-center min-vh-100 bg-primary-subtle">
      <div className="card shadow-lg border-0 rounded-4" style={{ maxWidth: '420px', width: '100%' }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <h3 className="fw-bold text-primary mb-2">Ingresar DNI</h3>
            <p className="text-muted">Ingrese su número de documento</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="dni" className="form-label fw-medium text-dark">DNI</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-person-vcard text-secondary" />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 ps-2"
                  id="dni"
                  value={dni}
                  onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                  placeholder="Ingrese su DNI"
                  maxLength={8}
                  required
                />
              </div>
              <div className="form-text">Ingrese su número de documento sin puntos</div>
            </div>

            <div className="d-grid">
              <button type="submit" className="btn btn-primary btn-lg rounded-3" disabled={loading}>
                {loading ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status"><span className="visually-hidden">Loading...</span></span>
                ) : (
                  <i className="bi bi-box-arrow-in-right me-2" />
                )}
                {loading ? 'Procesando...' : 'Ingresar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}
