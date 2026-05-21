import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../App'
import { getPacienteByDni } from '../services/pacienteService'
import { desactivarDoctor, getDoctores } from '../services/doctorService'
import { getEspecialidades } from '../services/especialidadService'
import { confirmarTurno, getAllTurnos, getTurnosByFecha, getTurnosByPaciente, getTurnosPendientes } from '../services/turnoService'
import { request } from '../services/api'

export default function MainAdmin() {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const [section, setSection] = useState('turnos')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [filtroFecha, setFiltroFecha] = useState('')
  const [filtroDni, setFiltroDni] = useState('')
  const [turnos, setTurnos] = useState([])
  const [turnosFiltrados, setTurnosFiltrados] = useState([])
  const [pacientes, setPacientes] = useState([])
  const [doctores, setDoctores] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('')
  const [loading, setLoading] = useState(true)
  const [doctorAEliminar, setDoctorAEliminar] = useState(null)
  const [showEliminarDoctorModal, setShowEliminarDoctorModal] = useState(false)

  const loadAll = async () => {
    setLoading(true)
    try {
      const [turnosPendientes, turnosTodos, doctoresData, pacientesData, especialidadesData] = await Promise.all([
        getTurnosPendientes(),
        getAllTurnos(),
        getDoctores(),
        request('/pacientes'),
        getEspecialidades(),
      ])
      setTurnos(Array.isArray(turnosPendientes) ? turnosPendientes : [])
      setTurnosFiltrados(Array.isArray(turnosTodos) ? turnosTodos : [])
      setDoctores(Array.isArray(doctoresData) ? doctoresData : [])
      setPacientes(Array.isArray(pacientesData) ? pacientesData : [])
      setEspecialidades(Array.isArray(especialidadesData) ? especialidadesData : [])
    } catch (error) {
      pushToast({ variant: 'danger', title: 'Error', message: 'No se pudieron cargar los datos administrativos' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [])

  const onClickEstadisticas = () => navigate('/estadisticas')
  const onClickRegistrarDoctor = () => navigate('/registro-doctor')
  const closeMobileMenu = () => setMobileMenuOpen(false)

  const confirmarDoctor = async (turnoId) => {
    try {
      await confirmarTurno(turnoId)
      pushToast({ variant: 'success', title: 'Éxito', message: 'Turno confirmado' })
      await loadAll()
    } catch {
      pushToast({ variant: 'danger', title: 'Error', message: 'No se pudo confirmar el turno' })
    }
  }

  const openEliminarDoctorModal = (doctor) => {
    setDoctorAEliminar(doctor)
    setShowEliminarDoctorModal(true)
  }

  const confirmarEliminarDoctor = async () => {
    if (!doctorAEliminar?._id) return
    try {
      await desactivarDoctor(doctorAEliminar._id)
      pushToast({ variant: 'success', title: 'Éxito', message: 'Doctor desactivado correctamente' })
      setShowEliminarDoctorModal(false)
      setDoctorAEliminar(null)
      await loadAll()
    } catch {
      pushToast({ variant: 'danger', title: 'Error', message: 'No se pudo desactivar el doctor' })
    }
  }

  const filtrarTurnos = async () => {
    try {
      if (!filtroFecha && !filtroDni) {
        await loadAll()
        return
      }

      if (filtroDni && filtroFecha) {
        const paciente = await getPacienteByDni(filtroDni)
        if (!paciente?._id) {
          setTurnosFiltrados([])
          return
        }
        const turnosPaciente = await getTurnosByPaciente(paciente._id)
        const fechaFiltro = filtroFecha.replace(/-/g, '/')
        setTurnosFiltrados((Array.isArray(turnosPaciente) ? turnosPaciente : []).filter((turno) => String(turno.fecha).replace(/-/g, '/') === fechaFiltro))
        return
      }

      if (filtroDni) {
        const paciente = await getPacienteByDni(filtroDni)
        if (!paciente?._id) {
          setTurnosFiltrados([])
          return
        }
        const turnosPaciente = await getTurnosByPaciente(paciente._id)
        setTurnosFiltrados(Array.isArray(turnosPaciente) ? turnosPaciente : [])
        return
      }

      if (filtroFecha) {
        const turnosFecha = await getTurnosByFecha(filtroFecha)
        setTurnosFiltrados(Array.isArray(turnosFecha) ? turnosFecha : [])
      }
    } catch (error) {
      pushToast({ variant: 'danger', title: 'Error', message: 'Error al filtrar turnos' })
      setTurnosFiltrados([])
    }
  }

  const limpiarFiltros = () => {
    setFiltroFecha('')
    setFiltroDni('')
    setFiltroEspecialidad('')
    loadAll()
  }

  const getArchivoPago = (turno) => {
    if (!Array.isArray(turno.archivos)) return null
    return turno.archivos.find((archivo) => archivo.tipo === 'pago') || null
  }

  const renderArchivoPago = (turno) => {
    const archivoPago = getArchivoPago(turno)

    if (!archivoPago) {
      return <span className="text-secondary">Sin comprobante</span>
    }

    return (
      <div className="d-flex flex-column gap-1">
        <a href={archivoPago.url} target="_blank" rel="noreferrer" className="btn btn-sm btn-primary align-self-start">
          Ver comprobante
        </a>
        <div className="small text-muted">{archivoPago.nombre || archivoPago.url}</div>
      </div>
    )
  }

  const cards = useMemo(() => ([
    { label: 'Turnos pendientes', value: turnos.length, icon: 'bi-calendar-check', color: 'primary' },
    { label: 'Pacientes', value: pacientes.length, icon: 'bi-people', color: 'success' },
    { label: 'Doctores', value: doctores.length, icon: 'bi-person-badge', color: 'info' },
    { label: 'Turnos totales', value: turnosFiltrados.length, icon: 'bi-list-check', color: 'warning' },
  ]), [turnos.length, pacientes.length, doctores.length, turnosFiltrados.length])

  const doctoresFiltrados = useMemo(() => {
    if (!filtroEspecialidad) return doctores
    return doctores.filter((d) => (d.especialidad?._id || d.especialidad) === filtroEspecialidad)
  }, [doctores, filtroEspecialidad])

  const buscarPacientePorDni = async () => {
    if (!filtroDni) {
      await loadAll()
      return
    }
    try {
      const paciente = await getPacienteByDni(filtroDni)
      setPacientes(paciente?._id ? [paciente] : [])
    } catch (err) {
      pushToast({ variant: 'danger', title: 'Error', message: 'Error al buscar paciente por DNI' })
      setPacientes([])
    }
  }

  return (
    <div className="container-fluid main-admin-container">
      <div className="d-md-none bg-light border-bottom p-3 d-flex justify-content-between align-items-center">
        <h5 className="fw-bold mb-0 text-primary">Panel Admin</h5>
        <button className="btn btn-outline-primary" type="button" onClick={() => setMobileMenuOpen((v) => !v)}>
          <i className={`bi ${mobileMenuOpen ? 'bi-x' : 'bi-list'}`} />
        </button>
      </div>

      <div className={`d-md-none bg-light border-bottom ${mobileMenuOpen ? '' : 'd-none'}`}>
        <nav className="nav flex-column p-3 gap-2">
          <button className="btn btn-outline-primary w-100" type="button" onClick={() => { setSection('turnos'); closeMobileMenu() }}><i className="bi bi-calendar-check" /> Turnos a confirmar</button>
          <button className="btn btn-outline-primary w-100" type="button" onClick={() => { setSection('pacientes'); closeMobileMenu() }}><i className="bi bi-people" /> Pacientes</button>
          <button className="btn btn-outline-primary w-100" type="button" onClick={() => { setSection('doctores'); closeMobileMenu() }}><i className="bi bi-person-badge" /> Doctores</button>
          <button className="btn btn-outline-info w-100" type="button" onClick={() => { setSection('todos-turnos'); closeMobileMenu() }}><i className="bi bi-list-check" /> Todos los turnos</button>
          <button className="btn btn-outline-success w-100" type="button" onClick={() => { onClickRegistrarDoctor(); closeMobileMenu() }}><i className="bi bi-person-plus" /> Registrar Doctor</button>
          <button className="btn btn-outline-info w-100" type="button" onClick={() => { onClickEstadisticas(); closeMobileMenu() }}><i className="bi bi-graph-up" /> Estadísticas</button>
        </nav>
      </div>

      <div className="row g-0">
        <aside className="col-md-3 col-lg-2 px-0 bg-light shadow-sm min-vh-100 d-none d-md-flex flex-column admin-aside">
          <div className="p-3 border-bottom"><h5 className="fw-bold mb-0 text-primary">Panel Admin</h5></div>
          <nav className="nav flex-column p-3 gap-2">
            <button className={`btn btn-outline-primary w-100 ${section === 'turnos' ? 'active' : ''}`} type="button" onClick={() => setSection('turnos')}><i className="bi bi-calendar-check" /> Turnos a confirmar</button>
            <button className={`btn btn-outline-primary w-100 ${section === 'pacientes' ? 'active' : ''}`} type="button" onClick={() => setSection('pacientes')}><i className="bi bi-people" /> Pacientes</button>
            <button className={`btn btn-outline-primary w-100 ${section === 'doctores' ? 'active' : ''}`} type="button" onClick={() => setSection('doctores')}><i className="bi bi-person-badge" /> Doctores</button>
            <button className={`btn btn-outline-info w-100 ${section === 'todos-turnos' ? 'active' : ''}`} type="button" onClick={() => setSection('todos-turnos')}><i className="bi bi-list-check" /> Todos los turnos</button>
            <button className="btn btn-outline-success w-100" type="button" onClick={onClickRegistrarDoctor}><i className="bi bi-person-plus" /> Registrar Doctor</button>
            <button className="btn btn-outline-info w-100" type="button" onClick={onClickEstadisticas}><i className="bi bi-graph-up" /> Estadísticas</button>
          </nav>
          <div className="mt-auto p-3 small text-muted">&copy; 2025 Admin</div>
        </aside>

        <main className="col-12 col-md-9 col-lg-10 px-3 py-4">
          <div className="row g-3 mb-4">
            {cards.map((card) => (
              <div className="col-12 col-sm-6 col-xl-3" key={card.label}>
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body d-flex align-items-center gap-3 text-start">
                    <div className={`rounded-circle bg-${card.color} bg-opacity-10 text-${card.color} d-flex align-items-center justify-content-center`} style={{ width: '48px', height: '48px' }}>
                      <i className={`bi ${card.icon}`} />
                    </div>
                    <div>
                      <div className="small text-muted">{card.label}</div>
                      <div className="fw-bold fs-5">{card.value}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {section === 'todos-turnos' && (
            <>
              <h3 className="mb-4 fw-bold text-primary">Todos los turnos</h3>
              <div className="mb-3">
                <form className="row g-2" onSubmit={(e) => e.preventDefault()}>
                  <div className="col-12 col-sm-6 col-md-4"><input type="date" className="form-control" value={filtroFecha} onChange={(e) => setFiltroFecha(e.target.value)} placeholder="Fecha" /></div>
                  <div className="col-12 col-sm-6 col-md-4"><input type="text" className="form-control" placeholder="Buscar por DNI paciente" value={filtroDni} onChange={(e) => setFiltroDni(e.target.value)} /></div>
                  <div className="col-12 col-md-4 d-flex gap-2"><button className="btn btn-outline-primary flex-fill" type="button" onClick={filtrarTurnos}><i className="bi bi-search d-md-none" /><span className="d-none d-md-inline">Filtrar</span></button><button className="btn btn-outline-secondary flex-fill" type="button" onClick={limpiarFiltros}><i className="bi bi-x-circle d-md-none" /><span className="d-none d-md-inline">Limpiar</span></button></div>
                </form>
              </div>

              <div className="table-responsive rounded shadow-sm d-none d-md-block">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr><th>Paciente</th><th>DNI</th><th>Doctor</th><th>Fecha</th><th>Estado</th></tr>
                  </thead>
                  <tbody>
                    {turnosFiltrados.length === 0 ? (
                      <tr><td colSpan="5" className="text-center text-muted py-4"><i className="bi bi-info-circle" /> No hay turnos para mostrar.</td></tr>
                    ) : turnosFiltrados.map((turno) => (
                      <tr key={turno._id}>
                        <td>{turno.paciente?.nombre} {turno.paciente?.apellido}</td>
                        <td>{turno.paciente?.dni}</td>
                        <td>{turno.doctor?.nombre} {turno.doctor?.apellido}</td>
                        <td>{turno.fecha}</td>
                        <td>{turno.estado === 'pendiente' ? <span className="badge bg-warning text-dark">Pendiente</span> : turno.estado === 'confirmado' ? <span className="badge bg-info">Confirmado</span> : turno.estado === 'realizado' ? <span className="badge bg-success">Realizado</span> : <span className="badge bg-danger">Cancelado</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {section === 'turnos' && (
            <>
              <h3 className="mb-4 fw-bold text-primary">Turnos a confirmar</h3>
              {turnos.length === 0 ? <div className="alert alert-light text-center">No hay turnos pendientes.</div> : (
                <div className="row g-3">
                  {turnos.map((turno) => {
                    return (
                      <div className="col-12 col-md-6 col-xl-4" key={turno._id}>
                        <div className="card h-100 shadow-sm border-0">
                          <div className="card-body text-start d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                              <div>
                                <h5 className="card-title mb-1">{turno.paciente?.nombre} {turno.paciente?.apellido}</h5>
                                <div className="text-muted small">DNI: {turno.paciente?.dni}</div>
                              </div>
                              <span className="badge bg-warning text-dark">Pendiente</span>
                            </div>
                            <div className="small text-muted mb-2"><i className="bi bi-person-badge me-2" />{turno.doctor?.nombre} {turno.doctor?.apellido}</div>
                            <div className="small text-muted mb-2"><i className="bi bi-calendar-event me-2" />{turno.fecha} · {turno.hora}</div>
                            <div className="small text-muted mb-3"><i className="bi bi-receipt me-2" />Pago: {renderArchivoPago(turno)}</div>
                            <div className="mt-auto d-grid gap-2">
                              <button className="btn btn-primary" type="button" onClick={() => confirmarTurno(turno._id)}><i className="bi bi-check-circle me-2" />Confirmar turno</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {section === 'pacientes' && (
            <>
              <h3 className="mb-4 fw-bold text-primary">Pacientes</h3>
              <div className="mb-3">
                <form className="row g-2" onSubmit={(e) => e.preventDefault()}>
                  <div className="col-12 col-md-6"><input type="text" className="form-control" placeholder="Buscar paciente por DNI" value={filtroDni} onChange={(e) => setFiltroDni(e.target.value)} /></div>
                  <div className="col-12 col-md-6 d-flex gap-2"><button type="button" className="btn btn-outline-primary flex-fill" onClick={buscarPacientePorDni}><i className="bi bi-search d-md-none" /><span className="d-none d-md-inline">Buscar</span></button><button type="button" className="btn btn-outline-secondary flex-fill" onClick={() => { setFiltroDni(''); loadAll() }}><i className="bi bi-x-circle d-md-none" /><span className="d-none d-md-inline">Limpiar</span></button></div>
                </form>
              </div>

              <div className="row g-3">
                {pacientes.length === 0 ? <div className="col-12"><div className="alert alert-light text-center">Sin pacientes cargados.</div></div> : pacientes.map((paciente) => (
                  <div className="col-12 col-md-6 col-xl-4" key={paciente._id}>
                    <div className="card h-100 shadow-sm border-0">
                      <div className="card-body text-start">
                        <div className="d-flex align-items-center mb-3 gap-3">
                          <i className="bi bi-person-circle fs-1 text-primary" />
                          <div>
                            <h5 className="mb-0">{paciente.nombre} {paciente.apellido}</h5>
                            <span className="badge bg-secondary">DNI {paciente.dni}</span>
                          </div>
                        </div>
                        <div className="small text-muted mb-1"><i className="bi bi-envelope me-2" />{paciente.email || 'Sin email'}</div>
                        <div className="small text-muted"><i className="bi bi-telephone me-2" />{paciente.telefono || 'Sin teléfono'}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {section === 'doctores' && (
            <>
              <h3 className="mb-4 fw-bold text-primary">Doctores</h3>
              <div className="mb-3">
                <form className="row g-2" onSubmit={(e) => e.preventDefault()}>
                  <div className="col-12 col-md-6">
                    <select className="form-select" value={filtroEspecialidad} onChange={(e) => setFiltroEspecialidad(e.target.value)}>
                      <option value="">Todas las especialidades</option>
                      {especialidades.map((esp) => (<option key={esp._id} value={esp._id}>{esp.nombre}</option>))}
                    </select>
                  </div>
                  <div className="col-12 col-md-6 d-flex gap-2"><button type="button" className="btn btn-outline-secondary" onClick={() => setFiltroEspecialidad('')}>Limpiar</button></div>
                </form>
              </div>

              <div className="row g-3">
                {doctoresFiltrados.length === 0 ? <div className="col-12"><div className="alert alert-light text-center">Sin doctores cargados.</div></div> : doctoresFiltrados.map((doctor) => (
                  <div className="col-12 col-md-6 col-xl-4" key={doctor._id}>
                    <div className="card h-100 shadow-sm border-0">
                      <div className="card-body text-start d-flex flex-column">
                        <div className="d-flex align-items-center mb-3 gap-3">
                          <i className="bi bi-person-badge fs-1 text-primary" />
                          <div>
                            <h5 className="mb-0">{doctor.nombre} {doctor.apellido}</h5>
                            <span className="badge bg-primary bg-opacity-10 text-primary">{doctor.especialidad?.nombre || 'Sin especialidad'}</span>
                          </div>
                        </div>
                        <div className="small text-muted mb-1"><i className="bi bi-envelope me-2" />{doctor.email || 'Sin email'}</div>
                        <div className="small text-muted mb-1"><i className="bi bi-telephone me-2" />{doctor.telefono || 'Sin teléfono'}</div>
                        <div className="small text-muted mb-3"><i className="bi bi-cash-coin me-2" />${doctor.precioConsulta || 0}</div>
                        <div className="mt-auto d-grid gap-2">
                          <button className="btn btn-outline-primary" type="button" onClick={() => navigate(`/doctores/${doctor._id}`)}><i className="bi bi-eye me-2" />Ver perfil</button>
                          <button className="btn btn-outline-danger" type="button" onClick={() => openEliminarDoctorModal(doctor)}><i className="bi bi-trash me-2" />Desactivar</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {section === 'todos-turnos' && (
            <div className="d-md-none mt-3">
              {turnosFiltrados.map((turno) => (
                <div className="card mb-3 shadow-sm" key={turno._id}>
                  <div className="card-body text-start">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h6 className="card-title fw-bold mb-0">{turno.paciente?.nombre} {turno.paciente?.apellido}</h6>
                      {turno.estado === 'pendiente' ? <span className="badge bg-warning text-dark">Pendiente</span> : turno.estado === 'confirmado' ? <span className="badge bg-info">Confirmado</span> : turno.estado === 'realizado' ? <span className="badge bg-success">Realizado</span> : <span className="badge bg-danger">Cancelado</span>}
                    </div>
                    <div className="row text-sm">
                      <div className="col-6"><small className="text-muted">DNI:</small><div className="fw-semibold">{turno.paciente?.dni}</div></div>
                      <div className="col-6"><small className="text-muted">Fecha:</small><div className="fw-semibold">{turno.fecha}</div></div>
                      <div className="col-12 mt-2"><small className="text-muted">Doctor:</small><div className="fw-semibold">{turno.doctor?.nombre} {turno.doctor?.apellido}</div></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {showEliminarDoctorModal && doctorAEliminar && (
        <div className="modal fade show d-block custom-modal-backdrop">
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
            <div className="modal-content shadow rounded-4 border-0">
              <div className="modal-header bg-danger bg-opacity-10 border-0 rounded-top-4">
                <h5 className="modal-title text-danger d-flex align-items-center gap-2"><i className="bi bi-person-x-fill" /> Desactivar doctor</h5>
                <button type="button" className="btn-close" onClick={() => setShowEliminarDoctorModal(false)} aria-label="Cerrar" />
              </div>
              <div className="modal-body py-4 text-center">
                <p className="mb-0">¿Está seguro de que desea desactivar a {doctorAEliminar.nombre} {doctorAEliminar.apellido}?</p>
              </div>
              <div className="modal-footer d-flex justify-content-between border-0 pb-4 pt-0">
                <button type="button" className="btn btn-outline-secondary px-4" onClick={() => setShowEliminarDoctorModal(false)}><i className="bi bi-x-lg" /> No</button>
                <button type="button" className="btn btn-danger px-4" onClick={confirmarEliminarDoctor}><i className="bi bi-check-lg" /> Sí, desactivar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
