import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth, useToast } from '../App'
import { desvincularGoogle, getPaciente, updatePaciente } from '../services/pacienteService'
import { getTurnoById, getTurnosByEstado, getTurnosByPaciente, cancelTurno } from '../services/turnoService'
import { request } from '../services/api'
import { uploadFileWithProgress } from '../services/storageService'
import { subirArchivoMetadata } from '../services/archivoService'

const estadosTurno = [
  { value: 'todos', label: 'Todos', icon: 'bi-list-check' },
  { value: 'pendiente', label: 'Pendiente', icon: 'bi-hourglass-split' },
  { value: 'confirmado', label: 'Confirmado', icon: 'bi-check-circle' },
  { value: 'realizado', label: 'Realizado', icon: 'bi-calendar-check' },
  { value: 'cancelado', label: 'Cancelado', icon: 'bi-x-circle' },
]

function getEstadoLabel(estado) {
  return estadosTurno.find((item) => item.value === estado)?.label || 'Todos'
}

function getEstadoIcon(estado) {
  return estadosTurno.find((item) => item.value === estado)?.icon || 'bi-list-check'
}

function parseTurnoDateTime(turno) {
  const [dia = '0', mes = '0', anio = '0'] = String(turno?.fecha || '').split(/[/-]/)
  const [hora = '0', minuto = '0'] = String(turno?.hora || '0:0').split(':')
  const fecha = new Date(Number(anio), Number(mes) - 1, Number(dia), Number(hora), Number(minuto))
  return Number.isNaN(fecha.getTime()) ? 0 : fecha.getTime()
}

function parseTurnoDate(turnoFecha) {
  const [dia = '0', mes = '0', anio = '0'] = String(turnoFecha || '').split(/[/-]/)
  const fecha = new Date(Number(anio), Number(mes) - 1, Number(dia))
  return Number.isNaN(fecha.getTime()) ? null : fecha
}

function turnosMismaFecha(turnoFecha, inputFecha) {
  if (!inputFecha) return true
  const fechaTurno = parseTurnoDate(turnoFecha)
  if (!fechaTurno) return false
  const [anio, mes, dia] = inputFecha.split('-').map(Number)
  return fechaTurno.getFullYear() === anio && fechaTurno.getMonth() + 1 === mes && fechaTurno.getDate() === dia
}

function DoctorSelector({ pacienteId, onClose, onSelectDoctor }) {
  // onSelectDoctor(optional): callback(doctorId) to open reservation modal instead of navigation
  function DoctorSelectorInner(props) {
    return DoctorSelector(props)
  }
  const navigate = useNavigate()
  const [doctores, setDoctores] = useState([])
  const [especialidades, setEspecialidades] = useState([])
  const [busquedaNombre, setBusquedaNombre] = useState('')
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      try {
        const [d, e] = await Promise.all([request('/doctores'), request('/especialidades')])
        if (!active) return
        setDoctores(Array.isArray(d) ? d : [])
        setEspecialidades(Array.isArray(e) ? e : [])
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  const doctoresFiltrados = useMemo(() => {
    const nombre = busquedaNombre.toLowerCase().trim()
    return doctores.filter((doctor) => {
      const coincideNombre = !nombre || `${doctor.nombre} ${doctor.apellido}`.toLowerCase().includes(nombre)
      const coincideEspecialidad = !filtroEspecialidad || doctor.especialidad?._id === filtroEspecialidad
      return coincideNombre && coincideEspecialidad
    })
  }, [doctores, busquedaNombre, filtroEspecialidad])

  return (
    <div className="card shadow-sm p-3 mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <h3 className="mb-0">
          <i className="bi bi-person-badge text-primary me-2" /> Selecciona un doctor
        </h3>
        <button className="btn btn-outline-danger d-flex align-items-center gap-2 fw-bold" onClick={onClose} type="button">
          <i className="bi bi-x-circle" /> Cerrar selección
        </button>
      </div>

      <div className="row mb-4 align-items-end g-3">
        <div className="col-12 col-md-6">
          <label className="form-label fw-semibold">Buscar por nombre</label>
          <div className="input-group">
            <input className="form-control" type="text" placeholder="Nombre del doctor" value={busquedaNombre} onChange={(e) => setBusquedaNombre(e.target.value)} />
            <button className="btn btn-outline-primary" type="button" onClick={() => setBusquedaNombre((v) => v)}>
              <i className="bi bi-search" /> Buscar
            </button>
          </div>
        </div>
        <div className="col-12 col-md-6">
          <label className="form-label fw-semibold">Filtrar por especialidad</label>
          <select className="form-select" value={filtroEspecialidad} onChange={(e) => setFiltroEspecialidad(e.target.value)}>
            <option value="">Todas las especialidades</option>
            {especialidades.map((esp) => <option key={esp._id} value={esp._id}>{esp.nombre}</option>)}
          </select>
        </div>
      </div>

      {loading ? <div className="alert alert-info mb-0">Cargando doctores...</div> : (
        <div className="row g-4">
                  {doctoresFiltrados.map((doctor) => (
            <div className="col-12 col-sm-6 col-lg-4" key={doctor._id}>
              <div className="card h-100 shadow-sm border-0">
                <div className="card-body d-flex flex-column">
                  <div className="d-flex align-items-center mb-3 text-start">
                    <i className="bi bi-person-circle fs-1 text-primary me-3" />
                    <div>
                      <h5 className="card-title mb-0">{doctor.nombre} {doctor.apellido}</h5>
                      <span className="badge bg-secondary">{doctor.especialidad?.nombre || 'Sin especialidad'}</span>
                    </div>
                  </div>
                  <ul className="list-unstyled mb-4 flex-grow-1 text-start">
                    <li className="mb-2"><i className="bi bi-cash-coin me-2 text-success" /> <strong>Precio:</strong> ${doctor.precioConsulta}</li>
                    <li className="mb-2"><i className="bi bi-telephone me-2 text-info" /> <strong>Contacto:</strong> {doctor.telefono || 'Sin teléfono'}</li>
                  </ul>
                  <button className="btn btn-primary w-100 mt-auto" type="button" onClick={() => {
                    if (typeof onSelectDoctor === 'function') return onSelectDoctor(doctor._id)
                    navigate(`/paciente/${pacienteId}/turno/${doctor._id}`)
                  }}>
                    <i className="bi bi-calendar-plus me-2" /> Solicitar turno
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!loading && doctores.length === 0 && <div className="col-12"><div className="alert alert-warning text-center">No hay doctores cargados en el sistema.</div></div>}
          {!loading && doctores.length > 0 && doctoresFiltrados.length === 0 && <div className="col-12"><div className="alert alert-info text-center">No se encontraron doctores con los filtros seleccionados.</div></div>}
        </div>
      )}
    </div>
  )
}

export default function PatientDashboard() {
  const { idPaciente } = useParams()
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { pushToast } = useToast()

  const [paciente, setPaciente] = useState(null)
  const [turnos, setTurnos] = useState([])
  const [estadoFiltro, setEstadoFiltro] = useState('todos')
  const [filtroDropdownAbierto, setFiltroDropdownAbierto] = useState(false)
  const [especialidades, setEspecialidades] = useState([])
  const [filtroEspecialidadId, setFiltroEspecialidadId] = useState('')
  const [filtroEspecialidadAbierto, setFiltroEspecialidadAbierto] = useState(false)
  const [busquedaEspecialidad, setBusquedaEspecialidad] = useState('')
  const [filtroFecha, setFiltroFecha] = useState('')
  const [loading, setLoading] = useState(true)
  const [mostrarDoctores, setMostrarDoctores] = useState(false)
  const [mostrarModalEditarPerfil, setMostrarModalEditarPerfil] = useState(false)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [turnoIdParaCancelar, setTurnoIdParaCancelar] = useState(null)
  const [mostrarModalDetalle, setMostrarModalDetalle] = useState(false)
  const [detalleTurno, setDetalleTurno] = useState(null)
  const [archivoPagoFile, setArchivoPagoFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [subiendoArchivoPago, setSubiendoArchivoPago] = useState(false)
  const [cargandoEdicion, setCargandoEdicion] = useState(false)
  const [formEditarPerfil, setFormEditarPerfil] = useState({ email: '', telefono: '' })
  const [desvinculando, setDesvinculando] = useState(false)
  const [paginaActual, setPaginaActual] = useState(1)
  const [tamanioPagina] = useState(5)

  const cargarTurnos = async (estado = estadoFiltro) => {
    try {
      const data = estado === 'todos'
        ? await getTurnosByPaciente(idPaciente)
        : await getTurnosByEstado(estado, idPaciente)

      setTurnos((Array.isArray(data) ? data : []).sort((a, b) => parseTurnoDateTime(b) - parseTurnoDateTime(a)))
    } catch (error) {
      console.error('Error al obtener los turnos del paciente:', error)
      pushToast({ variant: 'danger', title: 'Error', message: 'No se pudieron cargar los turnos' })
    }
  }

  const cargarPaciente = async () => {
    const data = await getPaciente(idPaciente)
    setPaciente(data)
    setFormEditarPerfil({
      email: data?.email || '',
      telefono: data?.telefono || '',
    })
  }

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      try {
        const [_, __, especialidadesData] = await Promise.all([cargarPaciente(), cargarTurnos('todos'), request('/especialidades')])
        if (active) {
          setEspecialidades(Array.isArray(especialidadesData) ? especialidadesData : [])
        }
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idPaciente])

  const abrirModalEditarPerfil = () => setMostrarModalEditarPerfil(true)
  const cerrarModalEditarPerfil = () => setMostrarModalEditarPerfil(false)

  const onSubmitEditarPerfil = async (event) => {
    event.preventDefault()
    setCargandoEdicion(true)
    try {
      await updatePaciente(idPaciente, formEditarPerfil)
      setPaciente((current) => ({ ...current, ...formEditarPerfil }))
      pushToast({ variant: 'success', title: 'Éxito', message: 'Datos actualizados correctamente' })
      cerrarModalEditarPerfil()
    } catch (error) {
      pushToast({ variant: 'danger', title: 'Error', message: 'Error al actualizar los datos' })
    } finally {
      setCargandoEdicion(false)
    }
  }

  const onClickDesvincular = async () => {
    setDesvinculando(true)
    try {
      await desvincularGoogle(idPaciente)
      pushToast({ variant: 'success', title: 'Éxito', message: 'Cuenta desvinculada exitosamente' })
      navigate('/resetear-password')
    } catch (error) {
      pushToast({ variant: 'danger', title: 'Error', message: 'Error al desvincular la cuenta' })
    } finally {
      setDesvinculando(false)
    }
  }

  const onForgotPassword = () => navigate(`/paciente/${paciente?.dni}/resetear-password`)

  const onLogout = async () => {
    await logout()
    navigate('/')
  }
  const abrirModalCancelar = (turnoId) => {
    setTurnoIdParaCancelar(turnoId)
    setMostrarModal(true)
  }
  const cerrarModalCancelar = () => {
    setMostrarModal(false)
    setTurnoIdParaCancelar(null)
  }

  const confirmarCancelarTurno = async () => {
    if (!turnoIdParaCancelar) return
    try {
      await cancelTurno(turnoIdParaCancelar)
      pushToast({ variant: 'success', title: 'Turno cancelado', message: 'Turno cancelado exitosamente.' })
      cerrarModalCancelar()
      await cargarTurnos()
    } catch (error) {
      pushToast({ variant: 'danger', title: 'Error', message: 'No se pudo cancelar el turno.' })
    }
  }

  const abrirModalDetalle = async (turnoId) => {
    try {
      const turno = await getTurnoById(turnoId)
      setDetalleTurno(turno)
      setMostrarModalDetalle(true)
    } catch (error) {
      pushToast({ variant: 'danger', title: 'Error', message: 'No se pudo cargar el turno' })
    }
  }

  const abrirReservaParaDoctor = (doctorId) => {
    // Navegar a la página de reserva completa (comportamiento fiel a Angular)
    setMostrarDoctores(false)
    navigate(`/paciente/${idPaciente}/turno/${doctorId}`)
  }

  const handleUploadPago = async () => {
    if (!archivoPagoFile) {
      pushToast({ variant: 'warning', title: 'Seleccione archivo', message: 'Por favor seleccione un archivo para subir.' })
      return
    }
    if (!detalleTurno?._id) {
      pushToast({ variant: 'danger', title: 'Error', message: 'Turno inválido.' })
      return
    }

    setSubiendoArchivoPago(true)
    try {
      const fileName = archivoPagoFile.name
      const remotePath = `comprobantes/${detalleTurno._id}/${Date.now()}_${fileName}`
      const url = await uploadFileWithProgress(archivoPagoFile, remotePath, (pct) => setUploadProgress(pct))
      const nuevoArchivo = await subirArchivoMetadata(detalleTurno._id, { tipo: 'pago', url, nombre: fileName })

      setDetalleTurno((d) => ({ ...d, archivos: Array.isArray(d?.archivos) ? [...d.archivos, nuevoArchivo] : [nuevoArchivo] }))
      setTurnos((list) => list.map((t) => (t._id === detalleTurno._id ? { ...t, archivos: Array.isArray(t.archivos) ? [...t.archivos, nuevoArchivo] : [nuevoArchivo] } : t)))
      pushToast({ variant: 'success', title: 'Subida completada', message: 'Comprobante subido correctamente.' })
      setArchivoPagoFile(null)
      setUploadProgress(0)
    } catch (err) {
      console.error('Error subiendo comprobante:', err)
      pushToast({ variant: 'danger', title: 'Error', message: 'No se pudo subir el comprobante.' })
    } finally {
      setSubiendoArchivoPago(false)
    }
  }

  const getArchivosPago = (archivos) => (Array.isArray(archivos) ? archivos.filter((archivo) => archivo.tipo === 'pago') : [])
  const getArchivosMedicos = (archivos) => (Array.isArray(archivos) ? archivos.filter((archivo) => archivo.tipo === 'medico') : [])

  const especialidadesFiltradas = useMemo(() => {
    const texto = busquedaEspecialidad.toLowerCase().trim()
    return especialidades.filter((especialidad) => {
      if (!texto) return true
      return especialidad.nombre?.toLowerCase().includes(texto)
    })
  }, [especialidades, busquedaEspecialidad])

  const turnoFiltradoPorEspecialidadYFecha = useMemo(() => {
    return turnos.filter((turno) => {
      const coincideEspecialidad = !filtroEspecialidadId || turno.doctor?.especialidad?._id === filtroEspecialidadId
      const coincideFecha = turnosMismaFecha(turno.fecha, filtroFecha)
      return coincideEspecialidad && coincideFecha
    })
  }, [turnos, filtroEspecialidadId, filtroFecha])

  const totalPaginas = Math.max(1, Math.ceil(turnoFiltradoPorEspecialidadYFecha.length / tamanioPagina))
  const turnosPaginaActual = turnoFiltradoPorEspecialidadYFecha.slice((paginaActual - 1) * tamanioPagina, paginaActual * tamanioPagina)

  useEffect(() => {
    setPaginaActual(1)
  }, [estadoFiltro, turnos.length, filtroEspecialidadId, filtroFecha])

  useEffect(() => {
    if (!filtroEspecialidadAbierto) {
      setBusquedaEspecialidad('')
    }
  }, [filtroEspecialidadAbierto])

  const limpiarFiltrosTurnos = () => {
    setEstadoFiltro('todos')
    setFiltroEspecialidadId('')
    setFiltroFecha('')
    setFiltroDropdownAbierto(false)
    setFiltroEspecialidadAbierto(false)
    setBusquedaEspecialidad('')
    cargarTurnos('todos')
  }

  if (loading) return <section className="container py-5"><div className="alert alert-info">Cargando panel del paciente...</div></section>

  return (
    <section className="container py-4">
      <div className="row g-4">
        <div className="col-12 col-lg-4">
          <div className="perfil-section d-flex flex-column gap-3 p-4 bg-white h-100">
            <div className="d-flex align-items-center gap-4">
              <div><i className="bi bi-person-circle text-primary" style={{ fontSize: '3rem' }} /></div>
              <div>
                <div className="fw-bold fs-4 mb-1">{paciente?.nombre} {paciente?.apellido}</div>
                <div className="text-muted mb-1">
                  <i className="bi bi-envelope text-primary me-1" />
                  {paciente?.email ? paciente.email : <span className="text-muted"> Sin email registrado</span>}
                </div>
                <div className="text-muted"><i className="bi bi-card-text text-primary me-1" /> DNI: {paciente?.dni}</div>
              </div>
            </div>
            <hr className="my-2" />
            <div className="d-flex flex-column gap-2">
              <button className="btn btn-outline-primary d-flex align-items-center gap-2 w-100" onClick={abrirModalEditarPerfil} type="button"><i className="bi bi-pencil-square" /> Editar perfil</button>
              
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-8">
          <div className="turnos-section mb-4 h-100 bg-white rounded-3 shadow-sm p-4">
            <div className="row g-2 align-items-center mb-3 flex-column flex-md-row">
              <div className="col-12 col-md-auto flex-grow-1 mb-2 mb-md-0">
                <h2 className="mb-0 text-center text-md-start"><i className="bi bi-calendar2-check text-primary me-2" /> Mis Turnos</h2>
              </div>
              <div className="col-12 col-md-auto d-flex flex-wrap gap-2 justify-content-center justify-content-md-end align-items-center">
                <div className="dropdown filtro-estado-turno position-relative" onMouseLeave={() => setFiltroDropdownAbierto(false)}>
                  <button className="btn btn-outline-primary dropdown-toggle d-flex align-items-center gap-2" type="button" onClick={() => setFiltroDropdownAbierto((v) => !v)}>
                    <i className={`bi ${getEstadoIcon(estadoFiltro)}`} />
                    {getEstadoLabel(estadoFiltro)}
                  </button>
                  {filtroDropdownAbierto && (
                    <ul className="dropdown-menu shadow-sm rounded-3 show" style={{ display: 'block', minWidth: '200px', position: 'absolute', zIndex: 1000 }}>
                      {estadosTurno.map((estado) => (
                        <li key={estado.value}>
                          <button type="button" className="dropdown-item d-flex align-items-center gap-2" onClick={async () => { setEstadoFiltro(estado.value); setFiltroDropdownAbierto(false); await cargarTurnos(estado.value) }}>
                            <i className={`bi ${estado.icon}`} />{estado.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="dropdown position-relative" onMouseLeave={() => setFiltroEspecialidadAbierto(false)}>
                  <button className="btn btn-outline-primary dropdown-toggle d-flex align-items-center gap-2" type="button" onClick={() => setFiltroEspecialidadAbierto((v) => !v)}>
                    <i className="bi bi-search" />
                    {filtroEspecialidadId ? (especialidades.find((esp) => esp._id === filtroEspecialidadId)?.nombre || 'Especialidad') : 'Especialidad'}
                  </button>
                  {filtroEspecialidadAbierto && (
                    <div className="dropdown-menu shadow-sm rounded-3 show p-2" style={{ display: 'block', minWidth: '320px', position: 'absolute', zIndex: 1000 }}>
                      <input
                        className="form-control form-control-sm mb-2"
                        type="text"
                        placeholder="Escribe para filtrar especialidades"
                        value={busquedaEspecialidad}
                        onChange={(e) => setBusquedaEspecialidad(e.target.value)}
                      />
                      <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                        <button
                          type="button"
                          className={`dropdown-item rounded-2 ${!filtroEspecialidadId ? 'active' : ''}`}
                          onClick={() => { setFiltroEspecialidadId(''); setFiltroEspecialidadAbierto(false) }}
                        >
                          Todas las especialidades
                        </button>
                        {especialidadesFiltradas.map((especialidad) => (
                          <button
                            key={especialidad._id}
                            type="button"
                            className={`dropdown-item rounded-2 text-truncate ${filtroEspecialidadId === especialidad._id ? 'active' : ''}`}
                            onClick={() => { setFiltroEspecialidadId(especialidad._id); setFiltroEspecialidadAbierto(false) }}
                            title={especialidad.nombre}
                          >
                            {especialidad.nombre}
                          </button>
                        ))}
                        {especialidadesFiltradas.length === 0 && (
                          <div className="px-2 py-2 text-muted small">No hay coincidencias.</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <input
                  className="form-control"
                  style={{ maxWidth: '190px' }}
                  type="date"
                  value={filtroFecha}
                  onChange={(e) => setFiltroFecha(e.target.value)}
                  title="Filtrar por fecha"
                />
                <button className="btn btn-outline-secondary" type="button" onClick={limpiarFiltrosTurnos}>
                  <i className="bi bi-x-circle me-2" />Limpiar
                </button>
                <button className="btn btn-primary btn-turno d-flex align-items-center gap-2 w-100 w-md-auto justify-content-center" onClick={() => setMostrarDoctores(true)} type="button">
                  <i className="bi bi-plus-circle text-white" /> Nuevo Turno
                </button>
              </div>
            </div>

            {mostrarDoctores ? (
              <DoctorSelector pacienteId={idPaciente} onClose={() => setMostrarDoctores(false)} onSelectDoctor={abrirReservaParaDoctor} />
            ) : (
              <div className="d-flex flex-column align-items-stretch justify-content-start w-100" style={{ minHeight: '300px' }}>
                <div className="w-100" style={{ maxWidth: '650px', margin: '0 auto' }}>
                  {turnoFiltradoPorEspecialidadYFecha.length > 0 ? turnosPaginaActual.map((turno) => (
                    <div key={turno._id} className={`turno-card mb-3 p-3 border rounded-3 bg-white shadow-sm ${turno.estado === 'cancelado' ? 'opacity-75' : ''}`}>
                      <div className="turno-info text-start">
                        <i className="bi bi-clock-history text-primary me-2" />
                        <div>
                          <div className="fw-bold">{turno.doctor?.especialidad?.nombre || 'Especialidad'} - {turno.doctor?.nombre}</div>
                          <div className="text-muted small mb-1">
                            <i className="bi bi-calendar-event text-primary me-1" /> {turno.fecha} &nbsp;
                            <i className="bi bi-clock text-primary me-1" /> {turno.hora}
                          </div>
                          <span className={`badge ms-1 ${turno.estado === 'pendiente' ? 'bg-warning text-dark' : ''} ${turno.estado === 'confirmado' ? 'bg-info' : ''} ${turno.estado === 'realizado' ? 'bg-success' : ''} ${turno.estado === 'cancelado' ? 'bg-danger' : ''}`}>
                            <i className={`bi ${turno.estado === 'pendiente' ? 'bi-hourglass-split' : turno.estado === 'cancelado' ? 'bi-x-circle' : 'bi-check-circle'} me-1`} />
                            {turno.estado?.charAt(0).toUpperCase() + turno.estado?.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="d-flex gap-2 flex-wrap mt-3 justify-content-start w-100">
                        <button className="btn btn-outline-info btn-turno d-flex align-items-center gap-2" onClick={() => abrirModalDetalle(turno._id)} type="button"><i className="bi bi-eye" /> Ver detalles</button>
                        <button className="btn btn-outline-danger btn-turno d-flex align-items-center gap-2" onClick={() => abrirModalCancelar(turno._id)} disabled={turno.estado === 'cancelado'} type="button"><i className="bi bi-x-circle" /> Cancelar</button>
                      </div>
                    </div>
                  )) : <div className="alert alert-light text-center">No hay turnos reservados con esos filtros.</div>}

                  {turnoFiltradoPorEspecialidadYFecha.length > 0 && totalPaginas > 1 && (
                    <nav className="mt-4">
                      <ul className="pagination justify-content-center mb-0">
                        <li className={`page-item ${paginaActual === 1 ? 'disabled' : ''}`}>
                          <button className="page-link" type="button" onClick={() => setPaginaActual((v) => Math.max(1, v - 1))}>Anterior</button>
                        </li>
                        {Array.from({ length: totalPaginas }, (_, idx) => idx + 1).map((page) => (
                          <li key={page} className={`page-item ${paginaActual === page ? 'active' : ''}`}>
                            <button className="page-link" type="button" onClick={() => setPaginaActual(page)}>{page}</button>
                          </li>
                        ))}
                        <li className={`page-item ${paginaActual === totalPaginas ? 'disabled' : ''}`}>
                          <button className="page-link" type="button" onClick={() => setPaginaActual((v) => Math.min(totalPaginas, v + 1))}>Siguiente</button>
                        </li>
                      </ul>
                    </nav>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {mostrarModalEditarPerfil && (
        <div className="modal fade show d-block custom-modal-backdrop">
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
            <div className="modal-content shadow rounded-4 border-0">
              <div className="modal-header bg-primary bg-opacity-10 border-0 rounded-top-4">
                <h5 className="modal-title text-primary d-flex align-items-center gap-2"><i className="bi bi-person-lines-fill" /> Editar Perfil</h5>
                <button type="button" className="btn-close" onClick={cerrarModalEditarPerfil} aria-label="Cerrar" />
              </div>
              <form onSubmit={onSubmitEditarPerfil} autoComplete="off">
                <div className="modal-body py-4">
                  <div className="mb-3">
                    <label className="form-label fw-medium">Email</label>
                    <input className="form-control" type="email" value={formEditarPerfil.email} onChange={(e) => setFormEditarPerfil((s) => ({ ...s, email: e.target.value }))} readOnly={!!paciente?.uid_firebase} />
                    {paciente?.uid_firebase && (
                      <div className="alert alert-warning d-flex align-items-start gap-2 mt-2 py-2 px-3 border-0 rounded-3" style={{ backgroundColor: '#fff3cd', borderLeft: '4px solid #ffc107' }}>
                        <i className="bi bi-info-circle-fill text-warning mt-1" style={{ fontSize: '1.1rem' }} />
                        <div className="small text-start">
                          <div className="fw-semibold mb-1">Cuenta vinculada con Google</div>
                          <div className="text-muted">Para cambiar tu email, desvincula tu cuenta de Google</div>
                          <div className="text-muted">Deberás resetear tu contraseña</div>
                        </div>
                      </div>
                    )}
                    {paciente?.uid_firebase && (
                      <div className="mt-2 text-start">
                        <button type="button" className="btn btn-outline-warning btn-sm d-flex align-items-center gap-2" onClick={onClickDesvincular} disabled={desvinculando}>
                          <i className="bi bi-unlink" /> {desvinculando ? 'Desvinculando...' : 'Desvincular cuenta de Google'}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-medium">Teléfono</label>
                    <input className="form-control" type="text" maxLength={20} value={formEditarPerfil.telefono} onChange={(e) => setFormEditarPerfil((s) => ({ ...s, telefono: e.target.value }))} />
                  </div>
                </div>
                <div className="modal-footer d-flex justify-content-between border-0 pb-4 pt-0">
                  <button type="button" className="btn btn-outline-secondary px-4" onClick={cerrarModalEditarPerfil}><i className="bi bi-x-lg" /> Cancelar</button>
                  <button type="submit" className="btn btn-primary px-4" disabled={cargandoEdicion}><i className="bi bi-check-lg" /> {cargandoEdicion ? 'Guardando...' : 'Guardar cambios'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {mostrarModal && (
        <div className="modal fade show d-block custom-modal-backdrop">
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
            <div className="modal-content shadow rounded-4 border-0">
              <div className="modal-header bg-danger bg-opacity-10 border-0 rounded-top-4">
                <h5 className="modal-title text-danger d-flex align-items-center gap-2"><i className="bi bi-exclamation-triangle-fill" /> Confirmar cancelación</h5>
                <button type="button" className="btn-close" onClick={cerrarModalCancelar} aria-label="Cerrar" />
              </div>
              <div className="modal-body py-4 text-center">
                <p className="mb-0">¿Está seguro de que desea cancelar este turno?</p>
              </div>
              <div className="modal-footer d-flex justify-content-between border-0 pb-4 pt-0">
                <button type="button" className="btn btn-outline-secondary px-4" onClick={cerrarModalCancelar}><i className="bi bi-x-lg" /> No</button>
                <button type="button" className="btn btn-danger px-4" onClick={confirmarCancelarTurno}><i className="bi bi-check-lg" /> Sí, cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mostrarModalDetalle && detalleTurno && (
        <div className="modal fade show d-block custom-modal-backdrop">
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content shadow rounded-4 border-0">
              <div className="modal-header bg-primary bg-opacity-10 border-0 rounded-top-4">
                <h5 className="modal-title text-primary d-flex align-items-center gap-2"><i className="bi bi-clipboard-data" /> Detalles del turno</h5>
                <button type="button" className="btn-close" onClick={() => setMostrarModalDetalle(false)} aria-label="Cerrar" />
              </div>
              <div className="modal-body py-4 text-start">
                <div className="row g-3">
                  <div className="col-md-6"><strong>Doctor:</strong> {detalleTurno.doctor?.nombre} {detalleTurno.doctor?.apellido}</div>
                  <div className="col-md-6"><strong>Especialidad:</strong> {detalleTurno.doctor?.especialidad?.nombre}</div>
                  <div className="col-md-6"><strong>Fecha:</strong> {detalleTurno.fecha}</div>
                  <div className="col-md-6"><strong>Hora:</strong> {detalleTurno.hora}</div>
                  <div className="col-12"><strong>Observaciones:</strong><div className="mt-1 text-muted">{detalleTurno.observaciones || 'Sin observaciones'}</div></div>
                  <div className="col-12">
                    <strong>Archivos de pago:</strong>
                    {getArchivosPago(detalleTurno.archivos).length > 0 ? (
                      <ul className="list-group list-group-flush mt-2">
                        {getArchivosPago(detalleTurno.archivos).map((archivo) => <li key={archivo._id} className="list-group-item"><a href={archivo.url} target="_blank" rel="noreferrer">{archivo.nombre || archivo.url}</a></li>)}
                      </ul>
                    ) : <div className="text-muted mt-1">No hay comprobantes cargados.</div>}
                    <div className="mt-3">
                      <small className="text-muted d-block mb-2">Si abonaste en efectivo o transferencia, puedes subir tu comprobante aquí.</small>
                      <div className="d-flex flex-column flex-sm-row align-items-start gap-2">
                        <input type="file" className="form-control form-control-sm" onChange={(e) => setArchivoPagoFile(e.target.files?.[0] || null)} />
                        <button type="button" className="btn btn-primary btn-sm" onClick={handleUploadPago} disabled={subiendoArchivoPago || !archivoPagoFile}>
                          {subiendoArchivoPago ? `Subiendo ${uploadProgress}%` : 'Subir comprobante'}
                        </button>
                      </div>
                      {subiendoArchivoPago && (
                        <div className="progress mt-2" style={{ height: '6px' }}>
                          <div className="progress-bar" role="progressbar" style={{ width: `${uploadProgress}%` }} aria-valuenow={uploadProgress} aria-valuemin="0" aria-valuemax="100"></div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-12">
                    <strong>Archivos médicos:</strong>
                    {getArchivosMedicos(detalleTurno.archivos).length > 0 ? (
                      <ul className="list-group list-group-flush mt-2">
                        {getArchivosMedicos(detalleTurno.archivos).map((archivo) => <li key={archivo._id} className="list-group-item"><a href={archivo.url} target="_blank" rel="noreferrer">{archivo.nombre || archivo.url}</a></li>)}
                      </ul>
                    ) : <div className="text-muted mt-1">No hay archivos médicos cargados.</div>}
                  </div>
                </div>
              </div>
                <div className="modal-footer border-0 pb-4 pt-0">
                <button type="button" className="btn btn-outline-secondary px-4" onClick={async () => { setMostrarModalDetalle(false); await cargarTurnos(); }}><i className="bi bi-x-lg" /> Cerrar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      
    </section>
  )
}
