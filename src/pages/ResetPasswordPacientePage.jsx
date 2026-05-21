import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { request } from '../services/api'
import { useToast } from '../App'

export default function ResetPasswordPacientePage() {
  const navigate = useNavigate()
  const { dni } = useParams()
  const { pushToast } = useToast()
  const [newPassword, setNewPassword] = useState('')
  const [repeatPassword, setRepeatPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showRepeatPassword, setShowRepeatPassword] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const passwordMismatch = newPassword && repeatPassword && newPassword !== repeatPassword

  const onSubmit = async (event) => {
    event.preventDefault()
    setSubmitted(true)

    if (!newPassword || newPassword.length < 6 || passwordMismatch) {
      pushToast({ variant: 'warning', title: 'Validación', message: 'Revisá la contraseña ingresada.' })
      return
    }

    setIsLoading(true)
    try {
      await request('/auth/reset-password', {
        method: 'POST',
        body: { dni, newPassword },
      })
      pushToast({ variant: 'success', title: 'Éxito', message: 'Contraseña actualizada correctamente.' })
      navigate('/login')
    } catch (error) {
      pushToast({ variant: 'danger', title: 'Error', message: error?.message || 'No se pudo resetear la contraseña' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100 bg-primary-subtle">
      <div className="card shadow-lg border-0 rounded-4" style={{ maxWidth: '420px', width: '100%' }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <h3 className="fw-bold text-primary mb-2">Resetear Contraseña</h3>
            <p className="text-muted">Defina una nueva contraseña</p>
          </div>

          <form onSubmit={onSubmit}>
            <div className="mb-3">
              <label htmlFor="newPassword" className="form-label fw-medium text-dark">Nueva Contraseña</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-lock text-secondary" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control border-start-0 border-end-0 ps-2"
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ingrese su nueva contraseña"
                />
                <span className="input-group-text bg-light border-start-0" style={{ cursor: 'pointer' }} onClick={() => setShowPassword((v) => !v)}>
                  <i className={`${showPassword ? 'bi bi-eye-slash' : 'bi bi-eye'} text-secondary`} />
                </span>
              </div>
              <div className="form-text">Mínimo 6 caracteres</div>
              {submitted && newPassword.length > 0 && newPassword.length < 6 && (
                <div className="text-danger small mt-1"><i className="bi bi-exclamation-circle me-1" />La contraseña debe tener al menos 6 caracteres</div>
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="repeatPassword" className="form-label fw-medium text-dark">Repetir Nueva Contraseña</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-lock-fill text-secondary" />
                </span>
                <input
                  type={showRepeatPassword ? 'text' : 'password'}
                  className="form-control border-start-0 border-end-0 ps-2"
                  id="repeatPassword"
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  placeholder="Repita su nueva contraseña"
                />
                <span className="input-group-text bg-light border-start-0" style={{ cursor: 'pointer' }} onClick={() => setShowRepeatPassword((v) => !v)}>
                  <i className={`${showRepeatPassword ? 'bi bi-eye-slash' : 'bi bi-eye'} text-secondary`} />
                </span>
              </div>
              {submitted && passwordMismatch && (
                <div className="text-danger small mt-1"><i className="bi bi-exclamation-circle me-1" />Las contraseñas no coinciden</div>
              )}
            </div>

            <div className="d-grid">
              <button type="submit" className="btn btn-primary btn-lg rounded-3" disabled={isLoading}>
                {isLoading ? (
                  <span className="spinner-border spinner-border-sm me-2" role="status"><span className="visually-hidden">Loading...</span></span>
                ) : (
                  <i className="bi bi-shield-lock me-2" />
                )}
                {isLoading ? 'Procesando...' : 'Resetear Contraseña'}
              </button>
            </div>
          </form>

          <div className="text-center mt-3">
            <button type="button" onClick={() => navigate(-1)} className="btn btn-link text-decoration-none text-muted small p-0">
              <i className="bi bi-arrow-left me-1" /> Volver
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
