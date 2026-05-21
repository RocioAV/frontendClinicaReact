import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useToast } from '../App'
import { actualizarDoctor, getDoctorById } from '../services/doctorService'
import TurnoDetalleModal from '../components/TurnoDetalleModal'
import { eliminarArchivo } from '../services/archivoService'
import { subirArchivoMetadata } from '../services/archivoService'
import { uploadFileWithProgress } from '../services/storageService'
import { actualizarDetallesTurno, cancelTurno, getTurnosByDoctor, marcarRealizado } from '../services/turnoService'

const filtrosEstado = [
  { value: 'todos', label: 'Todos', icon: 'bi-circle-fill text-secondary' },
  { value: 'pendiente', label: 'Pendientes', icon: 'bi-circle-fill text-warning' },
  { value: 'confirmado', label: 'Confirmados', icon: 'bi-circle-fill text-info' },
  { value: 'realizado', label: 'Realizados', icon: 'bi-circle-fill text-success' },
  { value: 'cancelado', label: 'Cancelados', icon: 'bi-circle-fill text-danger' },
]

function parseTurnoDateTime(turno) {
  const [dia = '0', mes = '0', anio = '0'] = String(turno?.fecha || '').split(/[/-]/)
  const [hora = '0', minuto = '0'] = String(turno?.hora || '0:0').split(':')
  const fecha = new Date(Number(anio), Number(mes) - 1, Number(dia), Number(hora), Number(minuto))
  return Number.isNaN(fecha.getTime()) ? 0 : fecha.getTime()
}

function getEstadoBadgeClass(estado) {
  if (estado === 'pendiente') return 'bg-warning text-dark'
  if (estado === 'confirmado') return 'bg-info'
  if (estado === 'realizado') return 'bg-success'
  if (estado === 'cancelado') return 'bg-danger'
  return 'bg-secondary'
}

export default function MainDoctor() {
  const { idDoctor } = useParams()
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const [doctor, setDoctor] = useState(null)
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [dni, setDni] = useState('')
  const [ordenFecha, setOrdenFecha] = useState('reciente')
  const [paginaActual, setPaginaActual] = useState(1)
  const [tamanioPagina] = useState(5)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showPerfilModal, setShowPerfilModal] = useState(false)
  const [editandoObservacion, setEditandoObservacion] = useState(false)
  const [observacionEdit, setObservacionEdit] = useState('')
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null)
  const [doctorEdit, setDoctorEdit] = useState({ email: '', telefono: '', precioConsulta: '' })
  const [guardandoPerfil, setGuardandoPerfil] = useState(false)
  const [guardandoObservacion, setGuardandoObservacion] = useState(false)
  const [modalModo, setModalModo] = useState(null)
  const [turnoDetalle, setTurnoDetalle] = useState(null)
  const [archivoNombre, setArchivoNombre] = useState('')
  const [archivoFile, setArchivoFile] = useState(null)
  const [subiendoArchivo, setSubiendoArchivo] = useState(false)
  const [archivoProgress, setArchivoProgress] = useState(0)
  const [fileInputKey, setFileInputKey] = useState(0)

  const cargarData = async () => {
    setLoading(true)
    try {
      const [doctorData, turnosData] = await Promise.all([getDoctorById(idDoctor), getTurnosByDoctor(idDoctor)])
      setDoctor(doctorData)
      setDoctorEdit({
        email: doctorData?.email || '',
        telefono: doctorData?.telefono || '',
        precioConsulta: doctorData?.precioConsulta || 0,
      })
      setTurnos((Array.isArray(turnosData) ? turnosData : []).sort((a, b) => parseTurnoDateTime(b) - parseTurnoDateTime(a)))
    } catch (error) {
      pushToast({ variant: 'danger', title: 'Error', message: 'No se pudieron cargar los datos del doctor' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idDoctor])

  const turnosFiltrados = useMemo(() => {
    let result = [...turnos]
    if (filtroEstado !== 'todos') {
      result = result.filter((turno) => turno.estado === filtroEstado)
    }
    if (dni.trim()) {
      result = result.filter((turno) => String(turno.paciente?.dni || '').includes(dni.trim()))
    }
    result.sort((a, b) => {
      const fechaA = parseTurnoDateTime(a)
      const fechaB = parseTurnoDateTime(b)
      return ordenFecha === 'antiguo' ? fechaA - fechaB : fechaB - fechaA
    })
    return result
  }, [turnos, filtroEstado, dni, ordenFecha])

  const totalPaginas = Math.max(1, Math.ceil(turnosFiltrados.length / tamanioPagina))
  const turnosPaginaActual = turnosFiltrados.slice((paginaActual - 1) * tamanioPagina, paginaActual * tamanioPagina)

  useEffect(() => {
    setPaginaActual(1)
  }, [filtroEstado, dni, ordenFecha])

  const iniciarEdicionPerfil = () => setShowPerfilModal(true)
  const cancelarEdicionPerfil = () => setShowPerfilModal(false)

  const guardarPerfil = async (event) => {
    event.preventDefault()
    setGuardandoPerfil(true)
    try {
      await actualizarDoctor(idDoctor, doctorEdit)
      pushToast({ variant: 'success', title: 'Éxito', message: 'Perfil actualizado exitosamente' })
      setShowPerfilModal(false)
      await cargarData()
    } catch (error) {
      pushToast({ variant: 'danger', title: 'Error', message: 'No se pudo actualizar el perfil' })
    } finally {
      setGuardandoPerfil(false)
    }
  }

  const iniciarEdicionObservacion = (turno) => {
    setTurnoSeleccionado(turno)
    setObservacionEdit(turno?.observaciones || '')
    setEditandoObservacion(true)
  }

  const abrirDetalleTurno = (turno) => {
    setTurnoDetalle(turno)
    setArchivoNombre('')
    setArchivoFile(null)
    setArchivoProgress(0)
    setFileInputKey((v) => v + 1)
  }

  const cerrarDetalleTurno = () => {
    setTurnoDetalle(null)
    setArchivoNombre('')
    setArchivoFile(null)
    setArchivoProgress(0)
    setFileInputKey((v) => v + 1)
  }

  const handleArchivoSeleccionado = (event) => {
    const selectedFile = event.target.files?.[0] || null
    setArchivoFile(selectedFile)
    if (selectedFile && !archivoNombre) {
      setArchivoNombre(selectedFile.name)
    }
  }

  const eliminarArchivoDetalle = async (archivo) => {
    if (!archivo?._id || !turnoDetalle?._id) return

    // Seguridad: solo permitir que el doctor elimine archivos médicos
    if (archivo.tipo !== 'medico') {
      pushToast({ variant: 'warning', title: 'Acción no permitida', message: 'Solo se pueden eliminar archivos médicos desde esta vista.' })
      return
    }

    try {
      await eliminarArchivo(archivo._id)
      setTurnoDetalle((current) => ({
        ...current,
        archivos: Array.isArray(current?.archivos) ? current.archivos.filter((item) => item._id !== archivo._id) : [],
      }))
      setTurnos((current) => current.map((turno) => (
        turno._id === turnoDetalle._id
          ? { ...turno, archivos: Array.isArray(turno.archivos) ? turno.archivos.filter((item) => item._id !== archivo._id) : [] }
          : turno
      )))
      pushToast({ variant: 'success', title: 'Éxito', message: 'Archivo eliminado correctamente.' })
    } catch (error) {
      pushToast({ variant: 'danger', title: 'Error', message: 'No se pudo eliminar el archivo.' })
    }
  }

  const subirArchivoEnDetalle = async () => {
    if (!turnoDetalle?._id) return

    if (!archivoFile) {
      pushToast({ variant: 'warning', title: 'Archivo faltante', message: 'Seleccioná un archivo antes de subir.' })
      return
    }

    setSubiendoArchivo(true)
    try {
      const nombreFinal = (archivoNombre || archivoFile.name || 'archivo').trim()
      const pacienteId = turnoDetalle?.paciente?._id || 'sin-paciente'
      const storagePath = `doctores/${idDoctor}/pacientes/${pacienteId}/turnos/${turnoDetalle._id}/${Date.now()}_${archivoFile.name}`
      const url = await uploadFileWithProgress(archivoFile, storagePath, setArchivoProgress)
      const response = await subirArchivoMetadata(turnoDetalle._id, {
        tipo: 'medico',
        url,
        nombre: nombreFinal,
      })

      const nuevoArchivo = response?.archivo || {
        _id: `${Date.now()}`,
        tipo: 'medico',
        url,
        nombre: nombreFinal,
      }

      setTurnoDetalle((current) => ({
        ...current,
        archivos: [...(current?.archivos || []), nuevoArchivo],
      }))

      setTurnos((current) => current.map((turno) => (
        turno._id === turnoDetalle._id
          ? { ...turno, archivos: [...(turno.archivos || []), nuevoArchivo] }
          : turno
      )))

      pushToast({ variant: 'success', title: 'Éxito', message: 'Archivo subido correctamente.' })
      setArchivoNombre('')
      setArchivoFile(null)
      setArchivoProgress(0)
      setFileInputKey((v) => v + 1)
    } catch (error) {
      pushToast({ variant: 'danger', title: 'Error', message: error?.message || 'No se pudo subir el archivo.' })
    } finally {
      setSubiendoArchivo(false)
    }
  }

  const cancelarEdicionObservacion = () => {
    setEditandoObservacion(false)
    setObservacionEdit('')
    setTurnoSeleccionado(null)
  }

  const guardarObservacion = async () => {
    if (!turnoSeleccionado) return
    setGuardandoObservacion(true)
    try {
      await actualizarDetallesTurno(turnoSeleccionado._id, { observaciones: observacionEdit })
      pushToast({ variant: 'success', title: 'Éxito', message: 'Observación actualizada correctamente' })
      setTurnos((current) => current.map((turno) => (turno._id === turnoSeleccionado._id ? { ...turno, observaciones: observacionEdit } : turno)))
      cancelarEdicionObservacion()
    } catch (error) {
      pushToast({ variant: 'danger', title: 'Error', message: 'No se pudo actualizar la observación' })
    } finally {
      setGuardandoObservacion(false)
    }
  }

  const confirmarCancelarTurno = async (turno) => {
    setTurnoSeleccionado(turno)
    setModalModo('cancelar')
    try {
      await cancelTurno(turno._id)
      setTurnos((current) => current.map((item) => (item._id === turno._id ? { ...item, estado: 'cancelado' } : item)))
      pushToast({ variant: 'success', title: 'Éxito', message: 'Turno cancelado exitosamente.' })
      await cargarData()
    } catch {
      pushToast({ variant: 'danger', title: 'Error', message: 'No se pudo cancelar el turno' })
    } finally {
      setModalModo(null)
      setTurnoSeleccionado(null)
    }
  }

  const confirmarRealizarTurno = async (turno) => {
    setTurnoSeleccionado(turno)
    setModalModo('realizado')
    try {
      await marcarRealizado(turno._id)
      setTurnos((current) => current.map((item) => (item._id === turno._id ? { ...item, estado: 'realizado' } : item)))
      pushToast({ variant: 'success', title: 'Éxito', message: 'Turno marcado como realizado.' })
      await cargarData()
    } catch {
      pushToast({ variant: 'danger', title: 'Error', message: 'No se pudo marcar el turno' })
    } finally {
      setModalModo(null)
      setTurnoSeleccionado(null)
    }
  }

  const closeMobileMenu = () => setShowMobileMenu(false)

  if (loading) return <section className="container py-5"><div className="alert alert-info">Cargando turnos del doctor...</div></section>

  return (
    <div className="container-fluid main-doctor-container p-0">
      <div className="d-md-none bg-light border-bottom p-3 d-flex justify-content-between align-items-center">
        <h5 className="fw-bold mb-0 text-primary">Panel Doctor</h5>
        <button className="btn btn-outline-primary" type="button" onClick={() => setShowMobileMenu((v) => !v)}>
          <i className={`bi ${showMobileMenu ? 'bi-x' : 'bi-list'}`} />
        </button>
      </div>

      <div className={`d-md-none bg-light border-bottom ${showMobileMenu ? '' : 'd-none'}`}>
        <nav className="nav flex-column p-3 gap-2">
          <button className="btn btn-outline-success w-100" type="button" onClick={() => { iniciarEdicionPerfil(); closeMobileMenu() }}>
            <i className="bi bi-pencil-square" /> Editar perfil
          </button>
        </nav>
      </div>

      <div className="row g-0">
        <main className="col-12 px-3 py-4">
          <div className="row g-4">
            <div className="col-12 col-lg-3">
              <div className="perfil-section d-flex flex-column gap-3 p-4 bg-white rounded-3 shadow-sm">
                <div className="d-flex align-items-center gap-4 mb-3 text-start">
                  <div><i className="bi bi-person-badge text-primary" style={{ fontSize: '3.5rem' }} /></div>
                  <div>
                    <h2 className="fw-bold mb-1">{doctor?.nombre} {doctor?.apellido}</h2>
                    <span className="badge bg-primary bg-opacity-10 text-primary">{doctor?.especialidad?.nombre || 'Sin especialidad'}</span>
                  </div>
                </div>

                <div className="mb-3 text-start">
                  <h5 className="fw-semibold mb-3"><i className="bi bi-info-circle text-primary me-2" />Información personal</h5>
                  <div className="ps-3">
                    {doctor?.email && <div className="d-flex align-items-center mb-2"><i className="bi bi-envelope text-muted me-2" /><span>{doctor.email}</span></div>}
                    {doctor?.dni && <div className="d-flex align-items-center mb-2"><i className="bi bi-person text-muted me-2" /><span>DNI: {doctor.dni}</span></div>}
                    {doctor?.telefono && <div className="d-flex align-items-center mb-2"><i className="bi bi-telephone text-muted me-2" /><span>Telefono: {doctor.telefono}</span></div>}
                    {doctor?.precioConsulta && <div className="d-flex align-items-center mb-2"><i className="bi bi-cash text-muted me-2" /><span>Precio consulta: ${doctor.precioConsulta}</span></div>}
                    {doctor?.matricula && <div className="d-flex align-items-center mb-2"><i className="bi bi-card-text text-muted me-2" /><span>Matricula: {doctor.matricula}</span></div>}
                  </div>
                </div>

                <div className="d-grid gap-2">
                  <button className="btn btn-outline-primary d-flex align-items-center justify-content-center gap-2" onClick={iniciarEdicionPerfil} type="button"><i className="bi bi-pencil-square" /> Editar perfil</button>
                  <button className="btn btn-outline-secondary d-flex align-items-center justify-content-center gap-2" type="button" onClick={() => navigate(`/doctor/${doctor?.dni}/resetear-password-doctor`)} disabled={!doctor?.dni}><i className="bi bi-key" /> Cambiar contraseña</button>
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-9">
              <div className="turnos-section bg-white p-4 rounded-3 shadow-sm h-100">
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 pb-3 border-bottom">
                  <div className="mb-3 mb-md-0 text-start">
                    <h2 className="mb-1 fw-bold d-flex align-items-center gap-2"><i className="bi bi-calendar2-check text-primary" /> <span>Gestión de Turnos</span></h2>
                    <p className="text-muted small mb-0">Administra los turnos de tus pacientes</p>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    <div className="col-12 col-md-6">
                      <input type="number" min="0" value={dni} onChange={(e) => setDni(e.target.value)} className="form-control text-primary mb-2" placeholder="Buscar por DNI" />
                    </div>
                    <div className="dropdown d-inline-block">
                      <button className="btn btn-outline-primary dropdown-toggle d-flex align-items-center gap-2" type="button" data-bs-toggle="dropdown">
                        <i className="bi bi-funnel" /> Filtros
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                        <li><h6 className="dropdown-header">Estado del turno</h6></li>
                        {filtrosEstado.map((item) => (
                          <li key={item.value}>
                            <button className="dropdown-item" type="button" onClick={() => setFiltroEstado(item.value)}>
                              <i className={`bi ${item.icon}`} /> {item.label}
                            </button>
                          </li>
                        ))}
                        <li><hr className="dropdown-divider" /></li>
                        <li><h6 className="dropdown-header">Ordenar por</h6></li>
                        <li><button className="dropdown-item" type="button" onClick={() => setOrdenFecha('reciente')}><i className="bi bi-sort-down-alt me-2" />Más reciente</button></li>
                        <li><button className="dropdown-item" type="button" onClick={() => setOrdenFecha('antiguo')}><i className="bi bi-sort-up-alt me-2" />Más antiguo</button></li>
                      </ul>
                    </div>
                  </div>
                </div>

                {turnosFiltrados.length === 0 ? (
                  <div className="alert alert-light text-center">No hay turnos para mostrar.</div>
                ) : (
                  <>
                    <div className="table-responsive rounded shadow-sm d-none d-md-block">
                      <table className="table table-hover align-middle mb-0">
                        <thead className="table-light">
                          <tr>
                            <th>Paciente</th>
                            <th>DNI</th>
                            <th>Fecha</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {turnosPaginaActual.map((turno) => (
                            <tr key={turno._id}>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <div className="avatar-sm bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center"><i className="bi bi-person-fill" /></div>
                                  <div><div className="fw-semibold">{turno.paciente?.nombre} {turno.paciente?.apellido}</div></div>
                                </div>
                              </td>
                              <td><i className="bi bi-info-circle text-primary me-2" />{turno.paciente?.dni}</td>
                              <td>
                                <div className="d-flex flex-column"><span>{turno.fecha}</span><small className="text-muted"><i className="bi bi-clock text-primary me-2" />{turno.hora}</small></div>
                              </td>
                              <td><span className={`badge ${getEstadoBadgeClass(turno.estado)}`}><i className="bi bi-circle-fill me-1" style={{ fontSize: '0.5rem', position: 'relative', top: '2px' }} />{turno.estado?.charAt(0).toUpperCase() + turno.estado?.slice(1)}</span></td>
                              <td>
                                <div className="d-flex gap-2 justify-content-center flex-wrap">
                                  <button className="btn btn-outline-primary btn-sm" type="button" onClick={() => abrirDetalleTurno(turno)}><i className="bi bi-eye" /> Ver detalle</button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="d-md-none">
                      {turnosPaginaActual.map((turno) => (
                        <div key={turno._id} className="card mb-3 shadow-sm">
                          <div className="card-body text-start">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="card-title fw-bold mb-0">{turno.paciente?.nombre} {turno.paciente?.apellido}</h6>
                              <span className={`badge ${getEstadoBadgeClass(turno.estado)}`}>{turno.estado?.charAt(0).toUpperCase() + turno.estado?.slice(1)}</span>
                            </div>
                            <div className="row text-sm">
                              <div className="col-6"><small className="text-muted">DNI:</small><div className="fw-semibold">{turno.paciente?.dni}</div></div>
                              <div className="col-6"><small className="text-muted">Fecha:</small><div className="fw-semibold">{turno.fecha}</div></div>
                              <div className="col-12 mt-2"><small className="text-muted">Hora:</small><div className="fw-semibold">{turno.hora}</div></div>
                            </div>
                            <div className="d-grid gap-2 mt-3">
                              <button className="btn btn-outline-primary btn-sm" type="button" onClick={() => abrirDetalleTurno(turno)}><i className="bi bi-eye me-2" />Ver detalle</button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {totalPaginas > 1 && (
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
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {showPerfilModal && (
        <div className="modal fade show d-block custom-modal-backdrop">
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '430px' }}>
            <div className="modal-content shadow rounded-4 border-0">
              <div className="modal-header bg-primary bg-opacity-10 border-0 rounded-top-4">
                <h5 className="modal-title text-primary d-flex align-items-center gap-2"><i className="bi bi-person-lines-fill" /> Editar Perfil</h5>
                <button type="button" className="btn-close" onClick={cancelarEdicionPerfil} aria-label="Cerrar" />
              </div>
              <form onSubmit={guardarPerfil}>
                <div className="modal-body py-4 text-start">
                  <div className="mb-3"><label className="form-label fw-medium">Email</label><input className="form-control" type="email" value={doctorEdit.email} onChange={(e) => setDoctorEdit((s) => ({ ...s, email: e.target.value }))} /></div>
                  <div className="mb-3"><label className="form-label fw-medium">Teléfono</label><input className="form-control" type="text" value={doctorEdit.telefono} onChange={(e) => setDoctorEdit((s) => ({ ...s, telefono: e.target.value }))} /></div>
                  <div className="mb-3"><label className="form-label fw-medium">Precio consulta</label><input className="form-control" type="number" min="0" value={doctorEdit.precioConsulta} onChange={(e) => setDoctorEdit((s) => ({ ...s, precioConsulta: e.target.value }))} /></div>
                </div>
                <div className="modal-footer d-flex justify-content-between border-0 pb-4 pt-0">
                  <button type="button" className="btn btn-outline-secondary px-4" onClick={cancelarEdicionPerfil}><i className="bi bi-x-lg" /> Cancelar</button>
                  <button type="submit" className="btn btn-primary px-4" disabled={guardandoPerfil}><i className="bi bi-check-lg" /> {guardandoPerfil ? 'Guardando...' : 'Guardar cambios'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {editandoObservacion && turnoSeleccionado && (
        <div className="modal fade show d-block custom-modal-backdrop">
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '430px' }}>
            <div className="modal-content shadow rounded-4 border-0">
              <div className="modal-header bg-info bg-opacity-10 border-0 rounded-top-4">
                <h5 className="modal-title text-info d-flex align-items-center gap-2"><i className="bi bi-chat-left-text" /> Editar observación</h5>
                <button type="button" className="btn-close" onClick={cancelarEdicionObservacion} aria-label="Cerrar" />
              </div>
              <div className="modal-body py-4 text-start">
                <div className="mb-3"><label className="form-label fw-medium">Observaciones</label><textarea className="form-control" rows={4} value={observacionEdit} onChange={(e) => setObservacionEdit(e.target.value)} /></div>
                <div className="small text-muted">Paciente: {turnoSeleccionado.paciente?.nombre} {turnoSeleccionado.paciente?.apellido}</div>
              </div>
              <div className="modal-footer d-flex justify-content-between border-0 pb-4 pt-0">
                <button type="button" className="btn btn-outline-secondary px-4" onClick={cancelarEdicionObservacion}><i className="bi bi-x-lg" /> Cancelar</button>
                <button type="button" className="btn btn-primary px-4" onClick={guardarObservacion} disabled={guardandoObservacion}><i className="bi bi-check-lg" /> {guardandoObservacion ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {modalModo && turnoSeleccionado && (
        <div className="modal fade show d-block custom-modal-backdrop">
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '400px' }}>
            <div className="modal-content shadow rounded-4 border-0">
              <div className={`modal-header border-0 rounded-top-4 ${modalModo === 'cancelar' ? 'bg-danger bg-opacity-10' : 'bg-success bg-opacity-10'}`}>
                <h5 className={`modal-title d-flex align-items-center gap-2 ${modalModo === 'cancelar' ? 'text-danger' : 'text-success'}`}>
                  <i className={`bi ${modalModo === 'cancelar' ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'}`} />
                  {modalModo === 'cancelar' ? 'Cancelar turno' : 'Marcar como realizado'}
                </h5>
              </div>
              <div className="modal-body py-4 text-center">
                <p className="mb-0">
                  {modalModo === 'cancelar'
                    ? 'El turno será cancelado.'
                    : 'El turno será marcado como realizado.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {turnoDetalle && (
        <TurnoDetalleModal
          open={Boolean(turnoDetalle)}
          turno={turnoDetalle}
          variant="doctor"
          onClose={cerrarDetalleTurno}
          onEditObservacion={() => { cerrarDetalleTurno(); iniciarEdicionObservacion(turnoDetalle) }}
          onUploadArchivo={subirArchivoEnDetalle}
          archivoNombre={archivoNombre}
          onArchivoNombreChange={setArchivoNombre}
          onArchivoSeleccionado={handleArchivoSeleccionado}
          archivoFile={archivoFile}
          subiendoArchivo={subiendoArchivo}
          archivoProgress={archivoProgress}
          fileInputKey={fileInputKey}
          onDeleteArchivo={eliminarArchivoDetalle}
          onMarkRealizado={() => { const current = turnoDetalle; cerrarDetalleTurno(); confirmarRealizarTurno(current) }}
          onCancelTurno={() => { const current = turnoDetalle; cerrarDetalleTurno(); confirmarCancelarTurno(current) }}
        />
      )}
    </div>
  )
}
