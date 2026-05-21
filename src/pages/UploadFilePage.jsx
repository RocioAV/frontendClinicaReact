import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { subirArchivoMetadata } from '../services/archivoService'
import { uploadFileWithProgress } from '../services/storageService'
import { useToast } from '../App'

export default function UploadFilePage() {
  const { idPaciente, idTurno } = useParams()
  const navigate = useNavigate()
  const { pushToast } = useToast()

  const [tipo, setTipo] = useState('medico')
  const [file, setFile] = useState(null)
  const [nombre, setNombre] = useState('')
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setNombre(f.name)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      pushToast({ variant: 'warning', title: 'Archivo faltante', message: 'Seleccioná un archivo antes de continuar.' })
      return
    }

    setLoading(true)
    try {
      const path = `pacientes/${idPaciente}/turnos/${idTurno}/${Date.now()}_${file.name}`
      const url = await uploadFileWithProgress(file, path, setProgress)
      await subirArchivoMetadata(idTurno, { tipo, url, nombre })
      pushToast({ variant: 'success', title: 'Carga exitosa', message: 'Archivo subido y registrado correctamente.' })
      navigate(`/paciente/${idPaciente}`)
    } catch (err) {
      console.error(err)
      pushToast({ variant: 'danger', title: 'Error', message: err?.message || 'No se pudo subir el archivo' })
    } finally {
      setLoading(false)
      setProgress(0)
    }
  }

  return (
    <section className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h3 className="h5 fw-bold mb-3">Registrar archivo</h3>
              <form onSubmit={handleSubmit} className="d-grid gap-3">
                <select className="form-select" value={tipo} onChange={(e) => setTipo(e.target.value)}>
                  <option value="medico">Archivo médico</option>
                  <option value="pago">Comprobante de pago</option>
                </select>

                <div>
                  <label className="form-label">Archivo</label>
                  <input className="form-control" type="file" onChange={handleFileChange} />
                </div>

                <div>
                  <label className="form-label">Nombre (opcional)</label>
                  <input className="form-control" placeholder="Nombre descriptivo" value={nombre} onChange={(e) => setNombre(e.target.value)} />
                </div>

                {progress > 0 && (
                  <div className="progress">
                    <div className="progress-bar" role="progressbar" style={{ width: `${progress}%` }}>{progress}%</div>
                  </div>
                )}

                <div className="d-grid"><button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'Subiendo...' : 'Subir y registrar'}</button></div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
