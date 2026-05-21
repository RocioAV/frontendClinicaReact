function getEstadoBadgeClass(estado) {
  if (estado === 'pendiente') return 'bg-warning text-dark'
  if (estado === 'confirmado') return 'bg-info'
  if (estado === 'realizado') return 'bg-success'
  if (estado === 'cancelado') return 'bg-danger'
  return 'bg-secondary'
}

function DetailRow({ label, value }) {
  return (
    <div className="mb-2">
      <span className="text-muted">{label}:</span> <span className="fw-semibold">{value || '-'}</span>
    </div>
  )
}

function ArchivoItem({ archivo, canDelete, onDelete }) {
  return (
    <div className="list-group-item px-0 d-flex justify-content-between align-items-center gap-3">
      <div className="min-w-0">
        <div className="fw-semibold text-truncate">{archivo.nombre || archivo.titulo || 'Archivo'}</div>
        <div className="small text-muted text-truncate">{archivo.tipo || 'Adjunto del turno'}</div>
      </div>
      <div className="d-flex align-items-center gap-2 flex-shrink-0">
        {archivo.url && (
          <a className="btn btn-sm btn-outline-primary" href={archivo.url} target="_blank" rel="noreferrer">
            <i className="bi bi-box-arrow-up-right me-1" /> Abrir
          </a>
        )}
        {canDelete && typeof onDelete === 'function' && archivo?._id && ((archivo.tipo === 'medico') || (archivo.tipo === 'pago')) && (
          <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => onDelete(archivo)}>
            <i className="bi bi-trash me-1" /> Eliminar
          </button>
        )}
      </div>
    </div>
  )
}

function FileSection({ title, files, emptyText, canDelete, onDelete }) {
  return (
    <div className="border rounded-3 p-3">
      <h6 className="fw-semibold mb-3">{title}</h6>
      {Array.isArray(files) && files.length > 0 ? (
        <div className="list-group list-group-flush">
          {files.map((archivo) => (
            <ArchivoItem key={archivo._id || archivo.url || archivo.nombre} archivo={archivo} canDelete={canDelete} onDelete={onDelete} />
          ))}
        </div>
      ) : (
        <div className="text-muted">{emptyText}</div>
      )}
    </div>
  )
}

export default function TurnoDetalleModal({
  open,
  onClose,
  turno,
  variant,
  onEditObservacion,
  observacionEdit,
  onObservacionEditChange,
  onUploadArchivo,
  archivoNombre,
  onArchivoNombreChange,
  onArchivoSeleccionado,
  archivoFile,
  subiendoArchivo,
  archivoProgress,
  fileInputKey,
  onUploadPago,
  archivoPagoFile,
  onArchivoPagoChange,
  subiendoArchivoPago,
  uploadProgress,
  onDeleteArchivo,
  onMarkRealizado,
  onCancelTurno,
}) {
  if (!open || !turno) return null

  const esDoctor = variant === 'doctor'
  const esPaciente = variant === 'patient'
  const doctor = turno.doctor || {}
  const paciente = turno.paciente || {}

  return (
    <div className="modal fade show d-block custom-modal-backdrop">
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content shadow rounded-4 border-0">
          <div className="modal-header bg-primary bg-opacity-10 border-0 rounded-top-4">
            <h5 className="modal-title text-primary d-flex align-items-center gap-2">
              <i className="bi bi-eye" /> Detalle del turno
            </h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Cerrar" />
          </div>

          <div className="modal-body py-4 text-start">
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <div className="border rounded-3 p-3 h-100">
                  <h6 className="fw-semibold mb-3">Datos del turno</h6>
                  <DetailRow label="Fecha" value={turno.fecha} />
                  <DetailRow label="Hora" value={turno.hora} />
                  <div className="mb-2">
                    <span className="text-muted">Estado:</span>{' '}
                    <span className={`badge ms-2 ${getEstadoBadgeClass(turno.estado)}`}>{turno.estado}</span>
                  </div>
                  <DetailRow label="Especialidad" value={doctor.especialidad?.nombre || 'Sin especialidad'} />
                </div>
              </div>

              <div className="col-12 col-md-6">
                <div className="border rounded-3 p-3 h-100">
                  <h6 className="fw-semibold mb-3">{esDoctor ? 'Datos del paciente' : 'Datos del doctor'}</h6>
                  {esDoctor ? (
                    <>
                      <DetailRow label="Nombre" value={`${paciente.nombre || ''} ${paciente.apellido || ''}`.trim()} />
                      <DetailRow label="DNI" value={paciente.dni} />
                      <DetailRow label="Email" value={paciente.email || '-'} />
                      <DetailRow label="Teléfono" value={paciente.telefono || '-'} />
                    </>
                  ) : (
                    <>
                      <DetailRow label="Nombre" value={`${doctor.nombre || ''} ${doctor.apellido || ''}`.trim()} />
                      <DetailRow label="Especialidad" value={doctor.especialidad?.nombre || 'Sin especialidad'} />
                      <DetailRow label="Email" value={doctor.email || '-'} />
                      <DetailRow label="Teléfono" value={doctor.telefono || '-'} />
                    </>
                  )}
                </div>
              </div>

              <div className="col-12">
                <div className="border rounded-3 p-3">
                  <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
                    <h6 className="fw-semibold mb-0">Observaciones</h6>
                    {esDoctor && typeof onEditObservacion === 'function' && (
                      <button type="button" className="btn btn-sm btn-outline-info" onClick={onEditObservacion}>
                        <i className="bi bi-pencil-square me-1" /> Editar observación
                      </button>
                    )}
                  </div>
                  {esDoctor ? (
                    <p className="mb-0 text-muted">{turno.observaciones || 'Sin observaciones registradas.'}</p>
                  ) : (
                    <p className="mb-0 text-muted">{turno.observaciones || 'Sin observaciones'}</p>
                  )}
                </div>
              </div>

              <div className="col-12 col-lg-6">
                {esDoctor ? (
                  <>
                    <FileSection
                      title="Archivos médicos"
                      files={(Array.isArray(turno.archivos) ? turno.archivos : []).filter((archivo) => archivo.tipo === 'medico')}
                      emptyText="No hay archivos médicos cargados."
                      canDelete={esDoctor}
                      onDelete={onDeleteArchivo}
                    />

                    <div className="border rounded-3 p-3 mt-3">
                      <h6 className="fw-semibold mb-3">Subir archivo médico</h6>
                      <div className="row g-2 align-items-end">
                        <div className="col-12 col-md-5">
                          <label className="form-label small text-muted mb-1">Archivo</label>
                          <input key={fileInputKey} className="form-control" type="file" onChange={onArchivoSeleccionado} />
                        </div>
                        <div className="col-12 col-md-5">
                          <label className="form-label small text-muted mb-1">Nombre</label>
                          <input className="form-control" type="text" value={archivoNombre} onChange={(event) => onArchivoNombreChange(event.target.value)} placeholder="Nombre descriptivo" />
                        </div>
                        <div className="col-12 col-md-2 d-grid">
                          <button type="button" className="btn btn-primary" onClick={onUploadArchivo} disabled={subiendoArchivo}>
                            {subiendoArchivo ? 'Subiendo...' : 'Subir'}
                          </button>
                        </div>
                        {subiendoArchivo && (
                          <div className="col-12">
                            <div className="progress" role="progressbar" aria-label="Progreso de subida" aria-valuemin="0" aria-valuemax="100" aria-valuenow={archivoProgress}>
                              <div className="progress-bar" style={{ width: `${archivoProgress}%` }}>{archivoProgress}%</div>
                            </div>
                          </div>
                        )}
                        {archivoFile && (
                          <div className="col-12 small text-muted">
                            Archivo seleccionado: {archivoFile.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <FileSection
                      title="Archivos de pago"
                      files={(Array.isArray(turno.archivos) ? turno.archivos : []).filter((archivo) => archivo.tipo === 'pago')}
                      emptyText="No hay comprobantes cargados."
                      canDelete={esPaciente}
                      onDelete={onDeleteArchivo}
                    />

                    <div className="border rounded-3 p-3 mt-3">
                      <h6 className="fw-semibold mb-3">Subir comprobante de pago</h6>
                      <small className="text-muted d-block mb-2">Si abonaste en efectivo o transferencia, puedes subir tu comprobante aquí.</small>
                      <div className="d-flex flex-column flex-sm-row align-items-start gap-2">
                        <input type="file" className="form-control form-control-sm" onChange={onArchivoPagoChange} />
                        <button type="button" className="btn btn-primary btn-sm" onClick={onUploadPago} disabled={subiendoArchivoPago || !archivoPagoFile}>
                          {subiendoArchivoPago ? `Subiendo ${uploadProgress}%` : 'Subir comprobante'}
                        </button>
                      </div>
                      {subiendoArchivoPago && (
                        <div className="progress mt-2" style={{ height: '6px' }}>
                          <div className="progress-bar" role="progressbar" style={{ width: `${uploadProgress}%` }} aria-valuenow={uploadProgress} aria-valuemin="0" aria-valuemax="100" />
                        </div>
                      )}
                      {archivoPagoFile && (
                        <div className="small text-muted mt-2">Archivo seleccionado: {archivoPagoFile.name}</div>
                      )}
                    </div>
                  </>
                )}
              </div>

              <div className="col-12 col-lg-6">
                <FileSection
                  title={esDoctor ? 'Archivos de pago' : 'Archivos médicos'}
                  files={(Array.isArray(turno.archivos) ? turno.archivos : []).filter((archivo) => (esDoctor ? archivo.tipo !== 'medico' : archivo.tipo !== 'pago'))}
                  emptyText={esDoctor ? 'No hay archivos de pago cargados.' : 'No hay archivos médicos cargados.'}
                  canDelete={false}
                  onDelete={onDeleteArchivo}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer border-0 pb-4 pt-0 d-flex justify-content-end gap-2">
            {esDoctor && typeof onMarkRealizado === 'function' && turno.estado !== 'realizado' && (
              <button type="button" className="btn btn-outline-success" onClick={onMarkRealizado}>
                <i className="bi bi-check-circle me-1" /> Marcar realizado
              </button>
            )}
            {esDoctor && typeof onCancelTurno === 'function' && turno.estado !== 'cancelado' && (
              <button type="button" className="btn btn-outline-danger" onClick={onCancelTurno}>
                <i className="bi bi-x-circle me-1" /> Cancelar turno
              </button>
            )}
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}