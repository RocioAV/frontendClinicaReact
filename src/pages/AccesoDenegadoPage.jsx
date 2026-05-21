import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'

export default function AccesoDenegadoPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  return (
    <section className="container">
      <div className="row py-5 align-items-center justify-content-center">
        <div className="col-11 col-sm-8 col-md-6 col-lg-5 text-center">
          <div className="card border-0 shadow-sm p-3 mx-auto">
            <div className="error-icon mb-3">
              <i className="bi bi-shield-exclamation text-danger" style={{ fontSize: '3rem' }} />
            </div>

            <h2 className="text-danger fw-bold mb-2">Acceso Denegado</h2>

            <p className="text-muted mb-3">
              Lo sentimos, no tienes los permisos necesarios para acceder a esta página.
            </p>

            {isAuthenticated ? (
              <>
                <p className="small text-muted mb-4">Tu rol actual no tiene acceso a esta sección.</p>
                <button className="btn btn-primary btn-lg" type="button" onClick={() => navigate('/')}>
                  <i className="bi bi-house-fill me-2" />
                  Volver al Inicio
                </button>
              </>
            ) : (
              <>
                <p className="small text-muted mb-4">Debes iniciar sesión con una cuenta que tenga los permisos necesarios.</p>
                <button className="btn btn-primary btn-lg" type="button" onClick={() => navigate('/login')}>
                  <i className="bi bi-box-arrow-in-right me-2" />
                  Iniciar Sesión
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
