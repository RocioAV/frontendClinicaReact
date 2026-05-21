import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { BrowserRouter, Navigate, NavLink, Outlet, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'
import { signInWithPopup, signOut } from 'firebase/auth'
import { firebaseAuth, googleProvider } from './config/firebase'
import { request } from './services/api'
import AccesoDenegadoPage from './pages/AccesoDenegadoPage'
import EspecialidadesPage from './pages/EspecialidadesPage'
import ListDoctoresPage from './pages/ListDoctoresPage'
import DoctorProfilePage from './pages/DoctorProfilePage'
import PatientDashboard from './pages/PatientDashboard'
import TurnoReserva from './pages/TurnoReserva'
import RegistroPaciente from './pages/RegistroPaciente'
import RegistroDoctor from './pages/RegistroDoctor'
import ResetPasswordPacientePage from './pages/ResetPasswordPacientePage'
import ResetPasswordDoctorPage from './pages/ResetPasswordDoctorPage'
import MainDoctor from './pages/MainDoctor'
import MainAdmin from './pages/MainAdmin'
import EstadisticasPage from './pages/EstadisticasPage'
import PagosPage from './pages/PagosPage'
import UploadFilePage from './pages/UploadFilePage'
import SolicitarDniGooglePage from './pages/SolicitarDniGooglePage'

const AuthContext = createContext(null)
const ToastContext = createContext(null)
import Header from './components/Header'
import Footer from './components/Footer'

function normalizeRole(role) {
  return String(role || '').trim().toLowerCase()
}

function isTokenValid(token) {
  if (!token) return false

  try {
    const decoded = jwtDecode(token)
    return !decoded?.exp || decoded.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('auth_token'))
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function bootstrap() {
      const storedToken = localStorage.getItem('auth_token')

      if (!isTokenValid(storedToken)) {
        localStorage.removeItem('auth_token')
        if (active) {
          setToken(null)
          setProfile(null)
          setLoading(false)
        }
        return
      }

      try {
        const userProfile = await request('/auth/me', { token: storedToken })

        if (active) {
          setToken(storedToken)
          setProfile(userProfile)
        }
      } catch {
        localStorage.removeItem('auth_token')
        if (active) {
          setToken(null)
          setProfile(null)
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    bootstrap()

    return () => {
      active = false
    }
  }, [])

  const login = async (credentials) => {
    const response = await request('/auth/login', {
      method: 'POST',
      body: credentials,
    })

    localStorage.setItem('auth_token', response.token)
    setToken(response.token)

    const userProfile = await request('/auth/me', { token: response.token })
    setProfile(userProfile)
    return userProfile
  }

  const setSession = async (newToken) => {
    if (!newToken) return null

    localStorage.setItem('auth_token', newToken)
    setToken(newToken)

    const userProfile = await request('/auth/me', { token: newToken })
    setProfile(userProfile)
    return userProfile
  }

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(firebaseAuth, googleProvider)
    const idToken = await result.user.getIdToken()

    const response = await request('/auth/login/firebase', {
      method: 'POST',
      body: { idToken },
    })

    if (response?.dniConfirmado === false) {
      return {
        needsDni: true,
        userData: response,
        token: idToken,
        googleUser: result.user,
      }
    }

    localStorage.setItem('auth_token', response.token)
    setToken(response.token)

    const userProfile = await request('/auth/me', { token: response.token })
    setProfile(userProfile)

    return { needsDni: false, profile: userProfile }
  }

  const vincularDni = async ({ dni, email, name, user_id }) => {
    return request('/auth/vincular-dni', {
      method: 'POST',
      body: { dni, email, name, user_id },
    })
  }

  const logout = async () => {
    try {
      await signOut(firebaseAuth)
    } catch {
      // Sin sesión activa en Firebase.
    }

    localStorage.removeItem('auth_token')
    setToken(null)
    setProfile(null)
  }

  const value = useMemo(
    () => ({
      token,
      profile,
      loading,
      login,
      loginWithGoogle,
      vincularDni,
      setSession,
      logout,
      isAuthenticated: Boolean(token) && Boolean(profile),
      hasRole: (role) => normalizeRole(profile?._rol) === normalizeRole(role),
      hasAnyRole: (roles) => roles.map(normalizeRole).includes(normalizeRole(profile?._rol)),
    }),
    [token, profile, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const pushToast = (toast) => {
    const id = `${Date.now()}-${Math.random()}`
    const nextToast = {
      id,
      title: toast.title || 'Notificación',
      message: toast.message || '',
      variant: toast.variant || 'primary',
    }

    setToasts((current) => [...current, nextToast])

    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, toast.delay ?? 4000)
  }

  return (
    <ToastContext.Provider value={{ pushToast }}>
      {children}
      <div className="toast-stack position-fixed top-0 end-0 p-3 d-grid gap-2">
        {toasts.map((toast) => (
          <div key={toast.id} className={`alert alert-${toast.variant} shadow mb-0`} role="alert">
            <strong className="d-block">{toast.title}</strong>
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast debe usarse dentro de ToastProvider')
  }
  return context
}

function shouldShowFooter(pathname) {
  const publicRoutes = ['/', '/especialidades', '/doctores', '/login', '/estadisticas', '/resetear-password']
  return publicRoutes.some((route) => (route === '/' ? pathname === '/' : pathname.startsWith(route)))
}

/* Footer component moved to src/components/Footer.jsx */

function Layout() {
  const location = useLocation()

  const auth = useAuth()

  return (
    <div className="app-shell d-flex flex-column min-vh-100">
      <Header profile={auth.profile} isAuthenticated={auth.isAuthenticated} logout={auth.logout} />
      <main className="app-main flex-grow-1 w-100">
        <Outlet />
      </main>
      {shouldShowFooter(location.pathname) && <Footer />}
    </div>
  )
}

function PlaceholderPage({ title, description }) {
  const { profile } = useAuth()

  return (
    <section className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0">
            <div className="card-body p-4 p-md-5">
              <h1 className="h3 fw-bold text-primary mb-3">{title}</h1>
              <p className="text-secondary mb-4">{description}</p>
              <div className="alert alert-info mb-4">Esta vista todavía está en migración desde Angular. La navegación ya queda conectada sin romper el flujo.</div>
              <pre className="bg-light rounded-3 p-3 mb-0 small">{JSON.stringify(profile, null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function DoctorProfilePreviewPage() {
  const { idDoctor } = useParams()
  const navigate = useNavigate()
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadDoctor() {
      setLoading(true)
      setError('')

      try {
        const data = await request(`/doctores/${idDoctor}`)
        if (active) setDoctor(data)
      } catch (err) {
        if (active) setError(err.message || 'Error al cargar el doctor')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDoctor()

    return () => {
      active = false
    }
  }, [idDoctor])

  if (loading) {
    return <section className="container py-5"><div className="alert alert-info">Cargando perfil del doctor...</div></section>
  }

  if (error) {
    return <section className="container py-5"><div className="alert alert-danger">{error}</div></section>
  }

  if (!doctor) {
    return <section className="container py-5"><div className="alert alert-warning">Doctor no encontrado</div></section>
  }

  return (
    <section className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4 p-md-5">
              <button type="button" className="btn btn-link p-0 mb-3" onClick={() => navigate('/doctores')}>
                <i className="bi bi-arrow-left me-2" />Volver a doctores
              </button>
              <h1 className="h3 fw-bold text-primary mb-2">Dr. {doctor.nombre} {doctor.apellido}</h1>
              <p className="text-secondary mb-4">{doctor.especialidad?.nombre || 'Sin especialidad asignada'}</p>

              <div className="row g-3 mb-4">
                <div className="col-md-4">
                  <div className="border rounded-3 p-3 bg-light h-100">
                    <div className="small text-secondary">Matrícula</div>
                    <div className="fw-semibold">{doctor.matricula || 'No informada'}</div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="border rounded-3 p-3 bg-light h-100">
                    <div className="small text-secondary">Consulta</div>
                    <div className="fw-semibold">${doctor.precioConsulta?.toLocaleString('es-AR') || '0'}</div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="border rounded-3 p-3 bg-light h-100">
                    <div className="small text-secondary">Estado</div>
                    <div className="fw-semibold">{doctor.activo ? 'Activo' : 'Inactivo'}</div>
                  </div>
                </div>
              </div>

              <div className="d-grid gap-2 d-md-flex">
                <button type="button" className="btn btn-primary" onClick={() => navigate('/login')}>
                  Solicitar turno
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/especialidades')}>
                  Ver especialidades
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function SpecialtiesPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError('')

      try {
        const [doctores, especialidades] = await Promise.all([
          request('/doctores'),
          request('/especialidades'),
        ])

        if (!active) return

        const map = new Map()
        especialidades.forEach((especialidad) => {
          map.set(especialidad._id, {
            ...especialidad,
            doctores: [],
          })
        })

        doctores.forEach((doctor) => {
          const id = doctor.especialidad?._id
          if (!id) return

          if (!map.has(id)) {
            map.set(id, {
              _id: id,
              nombre: doctor.especialidad?.nombre || 'Sin especialidad',
              descripcion: 'Especialidad médica profesional',
              doctores: [],
            })
          }

          map.get(id).doctores.push(doctor)
        })

        setItems(Array.from(map.values()).sort((a, b) => a.nombre.localeCompare(b.nombre)))
      } catch (err) {
        if (active) setError(err.message || 'Error al cargar especialidades')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  if (loading) {
    return <section className="container py-5"><div className="alert alert-info">Cargando especialidades...</div></section>
  }

  if (error) {
    return <section className="container py-5"><div className="alert alert-danger">{error}</div></section>
  }

  return (
    <section className="container py-5">
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold text-primary mb-1">Especialidades</h1>
          <p className="text-secondary mb-0">Especialidades médicas agrupadas con sus doctores activos.</p>
        </div>
        <button className="btn btn-outline-primary" type="button" onClick={() => window.location.reload()}>
          <i className="bi bi-arrow-clockwise me-2" />Refrescar
        </button>
      </div>

      <div className="row g-4">
        {items.map((especialidad) => (
          <div className="col-12 col-md-6 col-xl-4" key={especialidad._id}>
            <div className="card h-100 shadow-sm border-0">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                  <div>
                    <h2 className="h5 fw-bold mb-1">{especialidad.nombre}</h2>
                    <p className="text-secondary small mb-0">{especialidad.descripcion || 'Especialidad médica profesional'}</p>
                  </div>
                  <span className="badge text-bg-primary">{especialidad.doctores.length} doctores</span>
                </div>

                <div className="d-grid gap-2">
                  {especialidad.doctores.length > 0 ? especialidad.doctores.map((doctor) => (
                    <div key={doctor._id} className="border rounded-3 p-3 bg-light">
                      <div className="fw-semibold">Dr. {doctor.nombre} {doctor.apellido}</div>
                      <div className="text-secondary small">${doctor.precioConsulta?.toLocaleString('es-AR') || '0'} por consulta</div>
                    </div>
                  )) : (
                    <div className="text-secondary small">Sin doctores asignados por el momento.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function DoctorsPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [doctores, setDoctores] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [busquedaNombre, setBusquedaNombre] = useState('')
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadData = async (nombre = '', especialidad = '') => {
    setLoading(true)
    setError('')

    try {
      const especialidadesData = await request('/especialidades')
      setEspecialidades(especialidadesData)

      let doctorsData = []
      if (!nombre.trim() && !especialidad.trim()) {
        doctorsData = await request('/doctores')
      } else if (nombre.trim() && !especialidad.trim()) {
        doctorsData = await request(`/doctores/name?nombre=${encodeURIComponent(nombre.trim())}`)
      } else if (!nombre.trim() && especialidad.trim()) {
        doctorsData = await request(`/doctores/especialidad/${encodeURIComponent(especialidad.trim())}`)
      } else {
        const byName = await request(`/doctores/name?nombre=${encodeURIComponent(nombre.trim())}`)
        doctorsData = byName.filter((doctor) => doctor.especialidad?._id === especialidad.trim())
      }

      setDoctores(Array.isArray(doctorsData) ? doctorsData : [])
    } catch (err) {
      setError(err.message || 'Error al cargar doctores')
      setDoctores([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSearch = () => loadData(busquedaNombre, filtroEspecialidad)

  const handleReserva = (doctorId) => {
    if (normalizeRole(profile?._rol) === 'paciente') {
      navigate(`/paciente/${profile._id}/turno/${doctorId}`)
      return
    }

    navigate('/login')
  }

  return (
    <section className="container py-5">
      <div className="row justify-content-center mb-4">
        <div className="col-12 col-xl-10">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              <div className="row g-3 align-items-end">
                <div className="col-12 col-md-5">
                  <label className="form-label">Buscar por nombre</label>
                  <input className="form-control" value={busquedaNombre} onChange={(e) => setBusquedaNombre(e.target.value)} placeholder="Ej: Juan" />
                </div>
                <div className="col-12 col-md-5">
                  <label className="form-label">Especialidad</label>
                  <select className="form-select" value={filtroEspecialidad} onChange={(e) => setFiltroEspecialidad(e.target.value)}>
                    <option value="">Todas</option>
                    {especialidades.map((especialidad) => (
                      <option key={especialidad._id} value={especialidad._id}>{especialidad.nombre}</option>
                    ))}
                  </select>
                </div>
                <div className="col-12 col-md-2 d-grid">
                  <button type="button" className="btn btn-primary" onClick={handleSearch}>
                    <i className="bi bi-search me-2" />Buscar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div>
          <h1 className="h3 fw-bold text-primary mb-1">Doctores</h1>
          <p className="text-secondary mb-0">Listado de profesionales y especialidades disponibles.</p>
        </div>
        <button className="btn btn-outline-primary" type="button" onClick={() => loadData(busquedaNombre, filtroEspecialidad)}>
          <i className="bi bi-arrow-clockwise me-2" />Actualizar
        </button>
      </div>

      {loading && <div className="alert alert-info">Cargando doctores...</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-4">
        {doctores.map((doctor) => (
          <div className="col-12 col-md-6 col-xl-4" key={doctor._id}>
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                  <div>
                    <h2 className="h5 fw-bold mb-1">Dr. {doctor.nombre} {doctor.apellido}</h2>
                    <div className="text-primary small fw-semibold">{doctor.especialidad?.nombre || 'Sin especialidad'}</div>
                  </div>
                  <span className={`badge ${doctor.activo ? 'text-bg-success' : 'text-bg-secondary'}`}>
                    {doctor.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="text-secondary small mb-2"><i className="bi bi-envelope me-2" />{doctor.email || 'Sin email'}</div>
                <div className="text-secondary small mb-2"><i className="bi bi-telephone me-2" />{doctor.telefono || 'Sin teléfono'}</div>
                <div className="text-secondary small mb-4"><i className="bi bi-currency-dollar me-2" />${doctor.precioConsulta?.toLocaleString('es-AR') || '0'} por consulta</div>

                <div className="mt-auto d-grid gap-2">
                  <button className="btn btn-primary" type="button" onClick={() => handleReserva(doctor._id)}>
                    Solicitar turno
                  </button>
                  <button className="btn btn-outline-secondary" type="button" onClick={() => navigate(`/doctores/${doctor._id}`)}>
                    Ver perfil
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function SolicitudDniGooglePage() {
  const location = useLocation()
  const navigate = useNavigate()
  const auth = useAuth()
  const { pushToast } = useToast()
  const [dni, setDni] = useState('')
  const [loading, setLoading] = useState(false)

  const state = location.state || {}
  const userData = state.userData || {}
  const token = state.token || ''
  const googleUser = state.googleUser || {}

  useEffect(() => {
    if (!userData || !token) {
      pushToast({ variant: 'warning', title: 'Atención', message: 'Faltan datos de Google. Volvé a iniciar sesión.' })
    }
  }, [])

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
    <section className="container py-5">
      <div className="row justify-content-center">
        <div className="col-lg-7 col-xl-6">
          <div className="card border-0 shadow-lg">
            <div className="card-body p-4 p-md-5">
              <h1 className="h3 fw-bold text-primary mb-3">Vincular DNI</h1>
              <p className="text-secondary mb-4">
                Confirmá tu número de documento para terminar el acceso con Google.
              </p>

              <div className="alert alert-light border mb-4">
                <div className="fw-semibold">Cuenta detectada</div>
                <div className="small text-secondary">{googleUser.email || 'Sin email'} · {googleUser.displayName || 'Sin nombre'}</div>
              </div>

              <form className="d-grid gap-3" onSubmit={handleSubmit}>
                <div>
                  <label className="form-label fw-medium">DNI</label>
                  <input
                    className="form-control"
                    value={dni}
                    onChange={(event) => setDni(event.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="Ingrese su DNI"
                    maxLength={8}
                    inputMode="numeric"
                    required
                  />
                </div>

                <button className="btn btn-primary btn-lg" type="submit" disabled={loading}>
                  {loading ? 'Vinculando...' : 'Vincular DNI y continuar'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function HomePage() {
  const navigate = useNavigate()
  return (
    <div>
      <section className="hero-section py-5 py-lg-6">
        <div className="container py-4 py-lg-5">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <span className="badge bg-light text-primary mb-3">Portal de salud digital</span>
              <h1 className="display-4 fw-bold text-dark">Tu bienestar, nuestra prioridad</h1>
              <p className="lead text-muted mb-4">Reserva turnos, consulta doctores, gestiona pagos y revisa tu historial clínico y resultados desde una sola plataforma.</p>
              <div className="input-group input-group-lg mt-3 shadow-sm rounded overflow-hidden">
                <input className="form-control border-0" placeholder="Buscar profesionales, especialidades o turnos" />
                <button className="btn btn-primary" type="button"><i className="bi bi-search me-2" />Buscar</button>
              </div>

              <div className="d-flex gap-3 mt-4">
                <button className="btn btn-lg btn-primary btn-custom" type="button" onClick={() => navigate('/doctores')}><i className="bi bi-calendar-check-fill me-2" />Agendar Turno</button>
                <button className="btn btn-lg btn-outline-secondary" type="button" onClick={() => navigate('/login')}><i className="bi bi-box-arrow-in-right me-2" />Ingresar</button>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="hero-card card border-0 shadow-lg bg-white h-100">
                <div className="card-body p-4 p-md-5">
                  <h2 className="h5 fw-bold mb-3 text-dark">Accesos rápidos</h2>
                  <div className="row g-3">
                    {[
                      { icon: 'bi-search', title: 'Buscar profesionales', text: 'Explora perfiles y especialidades.', action: () => navigate('/doctores') },

                      { icon: 'bi-geo-alt-fill', title: 'Cómo llegar', text: 'Ubicación y contacto del consultorio.', action: () => document.getElementById('location-section')?.scrollIntoView({ behavior: 'smooth' }) },
                    ].map((card) => (
                      <div className="col-12 col-md-6" key={card.title}>
                        <button type="button" className="btn btn-light w-100 text-start p-3 h-100 shadow-sm rounded-3" onClick={card.action}>
                          <div className="d-flex align-items-start gap-3">
                            <div className="bg-primary bg-opacity-10 text-primary rounded-circle p-2"><i className={`bi ${card.icon} fs-4`} /></div>
                            <div>
                              <div className="fw-semibold">{card.title}</div>
                              <div className="text-secondary small">{card.text}</div>
                            </div>
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-5 bg-body-tertiary">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <h2 className="fw-bold text-primary mb-3">Tu salud, tu información al alcance</h2>
              <p className="text-secondary">Desde agendar citas hasta consultar tu historial clínico y resultados, la experiencia se mantiene centrada en el paciente.</p>
              <div className="d-grid gap-3 mt-4">
                <button className="btn btn-outline-secondary text-start" type="button" onClick={() => navigate('/especialidades')}><i className="bi bi-hospital me-2" />Ver especialidades</button>
                <a className="btn btn-outline-info text-start" href="mailto:soporte@consultorioslavalle.com"><i className="bi bi-chat-dots me-2" />Contactar soporte</a>
              </div>
            </div>
            <div className="col-lg-6 text-center">
              <img className="img-fluid rounded-4 shadow" alt="Portal del paciente" src="/portal.jpg" />
            </div>
          </div>
        </div>
      </section>

      <section className="py-5" id="location-section">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-8">
              <div className="ratio ratio-16x9 rounded-4 overflow-hidden shadow-sm">
                <iframe title="Ubicación" src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3656.2623187156!2d-65.41847628498765!3d-24.194431384398887!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x941b0f3c6eb910c7%3A0x8b8b8b8b8b8b8b8b!2sSan%20Salvador%20de%20Jujuy%2C%20Jujuy!5e0!3m2!1ses!2sar!4v1641234567890!5m2!1ses!2sar" loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen />
              </div>
            </div>
            <div className="col-lg-4">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body p-4">
                  <h3 className="h5 fw-bold">Contacto</h3>
                  <p className="text-secondary mb-2">📍 Consultorios Lavalle</p>
                  <p className="text-secondary mb-2">📞 (0388) 423-4567</p>
                  <p className="text-secondary mb-0">✉️ soporte@consultorioslavalle.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function LoginPage() {
  const auth = useAuth()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [dni, setDni] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const dniError = dni && !/^[0-9]{7,8}$/.test(dni) ? 'El DNI debe tener 7 u 8 dígitos' : ''
  const passwordError = password && password.length < 6 ? 'La contraseña debe tener al menos 6 caracteres' : ''
  const canSubmit = /^[0-9]{7,8}$/.test(dni) && password.length >= 6

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitted(true)

    if (!canSubmit) {
      pushToast({ variant: 'warning', title: 'Validación', message: 'Revisá los datos del login.' })
      return
    }

    setLoading(true)

    try {
      const profile = await auth.login({ dni, password })
      pushToast({ variant: 'success', title: 'Éxito', message: 'Inicio de sesión exitoso' })

      const role = normalizeRole(profile?._rol)
      if (role === 'paciente') {
        navigate(`/paciente/${profile._id}`)
      } else if (role === 'doctor') {
        navigate(`/doctor/${profile._id}`)
      } else if (role === 'admin' || role === 'administrador') {
        navigate('/admin')
      } else {
        navigate('/')
      }
    } catch (error) {
      pushToast({ variant: 'danger', title: 'Error', message: error?.message || 'No se pudo iniciar sesión' })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setLoading(true)

    try {
      const response = await auth.loginWithGoogle()

      if (response.needsDni) {
        navigate('/login/solicitud-dni', {
          state: {
            userData: response.userData,
            token: response.token,
            googleUser: {
              email: response.googleUser?.email,
              displayName: response.googleUser?.displayName,
              photoURL: response.googleUser?.photoURL,
              uid: response.googleUser?.uid,
            },
          },
        })
        return
      }

      pushToast({ variant: 'success', title: 'Éxito', message: 'Inicio de sesión con Google exitoso' })

      const profile = response.profile
      if (normalizeRole(profile?._rol) === 'paciente') {
        navigate(`/paciente/${profile._id}`)
      } else {
        navigate('/')
      }
    } catch {
      pushToast({ variant: 'danger', title: 'Error', message: 'No se pudo iniciar sesión con Google' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="auth-page py-5">
      <div className="container d-flex justify-content-center">
        <div className="card border-0 shadow-lg auth-card auth-card--sm w-100">
          <div className="card-body p-4 p-md-5">
            <div className="text-center mb-4">
              <h1 className="h3 fw-bold text-primary">Iniciar Sesión</h1>
              <p className="text-secondary mb-0">Accede a tu cuenta del consultorio</p>
            </div>

            <form onSubmit={handleSubmit} className="d-grid gap-3">
              <div>
                <label className="form-label fw-medium">DNI</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-person-vcard" /></span>
                  <input
                    className={`form-control ${dniError ? 'is-invalid' : ''}`}
                    value={dni}
                    onChange={(event) => setDni(event.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="Ingrese su DNI"
                    maxLength={8}
                    inputMode="numeric"
                    required
                  />
                </div>
                {dniError && <div className="invalid-feedback d-block">{dniError}</div>}
              </div>

              <div>
                <label className="form-label fw-medium">Contraseña</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-lock" /></span>
                  <input
                    className={`form-control ${passwordError ? 'is-invalid' : ''}`}
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Ingrese su contraseña"
                    minLength={6}
                    required
                  />
                  <button className="btn btn-outline-secondary" type="button" onClick={() => setShowPassword((current) => !current)}>
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                  </button>
                </div>
                {passwordError && <div className="invalid-feedback d-block">{passwordError}</div>}
              </div>

              <button className="btn btn-primary btn-lg" type="submit" disabled={loading || !canSubmit}>{loading ? 'Iniciando...' : 'Iniciar Sesión'}</button>
              <button className="btn btn-outline-secondary btn-lg" type="button" onClick={handleGoogleLogin} disabled={loading}><i className="bi bi-google text-danger me-2" />Continuar con Google</button>
              <button className="btn btn-link text-decoration-none" type="button" onClick={() => navigate('/login/registro-paciente')}>Crear cuenta nueva</button>
              <button className="btn btn-link text-decoration-none" type="button" onClick={() => navigate('/resetear-password')}>¿Olvidaste tu contraseña?</button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

function ProtectedRoute({ roles }) {
  const { loading, isAuthenticated, hasAnyRole } = useAuth()

  if (loading) {
    return <div className="container py-5">Cargando sesión...</div>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles && !hasAnyRole(roles)) {
    return <Navigate to="/acceso-denegado" replace />
  }

  return <Outlet />
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/especialidades" element={<EspecialidadesPage />} />
        <Route path="/doctores" element={<ListDoctoresPage />} />
        <Route path="/doctores/:idDoctor" element={<DoctorProfilePage />} />
        <Route path="/acceso-denegado" element={<AccesoDenegadoPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/solicitud-dni" element={<SolicitarDniGooglePage />} />
        <Route path="/login/registro-paciente" element={<RegistroPaciente />} />
        <Route path="/login/registro-doctor" element={<RegistroDoctor />} />
        <Route path="/resetear-password" element={<ResetPasswordPacientePage />} />
        

        <Route element={<ProtectedRoute roles={['paciente']} />}>
          <Route path="/paciente/:idPaciente" element={<PatientDashboard />} />
          <Route path="/paciente/:idPaciente/turno/:idDoctor" element={<TurnoReserva />} />
          <Route path="/paciente/:dni/resetear-password" element={<ResetPasswordPacientePage />} />
           <Route path="/paciente/:idPaciente/subir-archivo/:idTurno" element={<UploadFilePage />} />
           <Route path="/paciente/:idPaciente/pagos/:idTurno" element={<PagosPage />} />
        </Route>

        <Route element={<ProtectedRoute roles={['doctor']} />}>
           <Route path="/doctor/:idDoctor" element={<MainDoctor />} />
          <Route path="/doctor/:dni/resetear-password-doctor" element={<ResetPasswordDoctorPage />} />
        </Route>

        <Route element={<ProtectedRoute roles={['admin']} />}>
           <Route path="/admin" element={<MainAdmin />} />
           <Route path="/registro-doctor" element={<RegistroDoctor />} />
            <Route path="/estadisticas" element={<EstadisticasPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}

export default App

export { useToast, useAuth }
