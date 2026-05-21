import React from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'

function normalizeRole(role) {
  return String(role || '').trim().toLowerCase()
}

export default function Header({ profile, isAuthenticated, logout }) {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    if (typeof logout === 'function') await logout()
    navigate('/')
  }

  const roleLabel = profile?._rol ? String(profile._rol) : 'Invitado'

  const panelPath = profile?._rol?.toLowerCase() === 'doctor'
    ? `/doctor/${profile?._id}`
    : profile?._rol?.toLowerCase() === 'admin'
      ? '/admin'
      : `/paciente/${profile?._id}`

  return (
    <header className="app-header sticky-top bg-white border-bottom shadow-sm">
      <div className="top-strip d-none d-xl-flex justify-content-between align-items-center px-4 py-2 bg-dark text-light small">
        <span>📞 (0388) 423-4567</span>
        <span>📱 (0388) 15-555-6666</span>
        <div className="d-flex align-items-center gap-3">
          <a className="text-light text-decoration-none" href="https://wa.me/5493885556666" target="_blank" rel="noreferrer">
            <i className="bi bi-whatsapp me-1" /> WhatsApp
          </a>
          <button className="btn btn-sm btn-outline-light" type="button">Emergencia</button>
        </div>
      </div>

      <nav className="navbar navbar-expand-lg navbar-light px-3 px-md-4 py-2">
        <div className="container-fluid px-0">
          <button className="navbar-brand brand-link btn btn-link text-decoration-none p-0 d-flex align-items-center" onClick={() => navigate('/')} type="button">
            <span className="brand-mark me-2 d-none d-md-inline-flex align-items-center justify-content-center rounded-circle bg-primary text-white fw-bold"><img src="/logo.jpg" alt="logo " /></span>
            <span>
              <span className="brand-text fw-bold d-block">CONSULTORIOS LAVALLE</span>
              <small className="text-muted d-none d-md-block">Tu salud, nuestra prioridad</small>
            </span>
          </button>

          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav" aria-controls="mainNav" aria-expanded="false" aria-label="Alternar navegación">
            <span className="navbar-toggler-icon" />
          </button>

          <div id="mainNav" className="collapse navbar-collapse">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0 gap-lg-2 align-items-lg-center">
              <li className="nav-item"><NavLink className={({ isActive }) => `nav-link nav-pill ${isActive ? 'active fw-semibold' : ''}`} to="/">Inicio</NavLink></li>
              <li className="nav-item"><NavLink className={({ isActive }) => `nav-link nav-pill ${isActive ? 'active fw-semibold' : ''}`} to="/especialidades">Especialidades</NavLink></li>
              <li className="nav-item"><NavLink className={({ isActive }) => `nav-link nav-pill ${isActive ? 'active fw-semibold' : ''}`} to="/doctores">Profesionales</NavLink></li>
              {isAuthenticated && (
                <li className="nav-item"><NavLink className={({ isActive }) => `nav-link nav-pill ${isActive ? 'active fw-semibold' : ''}`} to={panelPath}>Mi panel</NavLink></li>
              )}
            </ul>

            <div className="d-flex align-items-center gap-3">
              {isAuthenticated && profile ? (
                <div className="dropdown d-none d-lg-block">
                  <button className="btn btn-outline-primary dropdown-toggle d-flex align-items-center gap-2 rounded-pill" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                    <i className="bi bi-person-circle" />
                    <span className="text-truncate" style={{ maxWidth: '180px' }}>{profile.nombre} {profile.apellido}</span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 rounded-4 p-2">
                    <li>
                      <h6 className="dropdown-header px-3 pt-2 pb-1 mb-0">
                        {profile.nombre} {profile.apellido}
                      </h6>
                    </li>
                    <li><span className="dropdown-item-text text-muted small px-3">{roleLabel}</span></li>
                    <li><hr className="dropdown-divider my-2" /></li>
                    <li><NavLink className="dropdown-item rounded-3" to={panelPath}><i className="bi bi-speedometer2 me-2" />Mi panel</NavLink></li>
                    {profile?._rol?.toLowerCase() === 'admin' && <li><NavLink className="dropdown-item rounded-3" to="/estadisticas"><i className="bi bi-graph-up me-2" />Estadísticas</NavLink></li>}
                    <li><button className="dropdown-item rounded-3 text-danger" type="button" onClick={handleLogout}><i className="bi bi-box-arrow-right me-2" />Cerrar sesión</button></li>
                  </ul>
                </div>
              ) : (
                <button className="btn btn-primary rounded-pill px-4" type="button" onClick={() => navigate('/login')}>
                  <i className="bi bi-box-arrow-in-right me-2" />Ingresar
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {location.pathname === '/' && (
        <div className="d-none d-md-block border-top bg-primary-subtle text-primary-emphasis px-3 py-2 text-center small">
          Tu salud, organizada en un solo lugar
        </div>
      )}
    </header>
  )
}
