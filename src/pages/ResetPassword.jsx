import { useState } from 'react'
import { request } from '../services/api'

export default function ResetPassword() {
  const [dniOrEmail, setDniOrEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await request('/auth/reset-password', { method: 'POST', body: { dni: dniOrEmail } })
      alert('Si el usuario existe, se envió el correo de recuperación.')
    } catch (err) {
      console.error(err)
      alert(err?.message || 'No se pudo procesar la solicitud')
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
              <h3 className="h5 fw-bold mb-3">Recuperar contraseña</h3>
              <form onSubmit={handleSubmit} className="d-grid gap-3">
                <input className="form-control" placeholder="DNI o email" value={dniOrEmail} onChange={(e) => setDniOrEmail(e.target.value)} required />
                <div className="d-grid"><button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Enviando...' : 'Enviar instrucciones'}</button></div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
