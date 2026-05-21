import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { createPreference } from '../services/pagoService'

export default function PagosPage() {
  const { idDoctor, idTurno, idPaciente } = useParams()
  const [loading, setLoading] = useState(false)

  const handlePago = async () => {
    setLoading(true)
    try {
      const pref = await createPreference(idDoctor || 'unknown', idTurno || 'unknown', { /* body placeholder */ })
      // Si backend devuelve init_point, redirigir
      if (pref?.init_point) {
        window.location.href = pref.init_point
        return
      }
      alert('Preferencia creada: ' + JSON.stringify(pref))
    } catch (err) {
      console.error(err)
      alert(err?.message || 'No se pudo crear la preferencia')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="container py-5">
      <div className="card shadow-sm">
        <div className="card-body p-4">
          <h3 className="h5 fw-bold mb-3">Pago de turno</h3>
          <p className="text-secondary">Inicia el flujo de pago con MercadoPago.</p>
          <div className="d-grid">
            <button className="btn btn-primary" onClick={handlePago} disabled={loading}>{loading ? 'Generando...' : 'Pagar con MercadoPago'}</button>
          </div>
        </div>
      </div>
    </section>
  )
}
