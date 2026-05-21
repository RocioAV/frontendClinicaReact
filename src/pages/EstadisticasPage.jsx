import { useEffect, useState } from 'react'
import { request } from '../services/api'

const statsRanges = [
  { value: 'all', label: 'Todo', subtitle: 'Histórico completo' },
  { value: 'week', label: 'Última semana', subtitle: '7 días' },
  { value: 'month', label: 'Último mes', subtitle: '30 días' },
  { value: '6m', label: 'Últimos 6 meses', subtitle: '180 días' },
]

function toCurrency(value) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(value || 0))
}

function normalizeItemLabel(item) {
  return item?.especialidad || item?.doctorNombre || item?._id || item?.hora || item?.dia || item?.nombre || 'Sin dato'
}

function getMaxValue(items, field = 'cantidad') {
  return Math.max(1, ...items.map((item) => Number(item?.[field] || 0)))
}

export default function EstadisticasPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState(null)
  const [range, setRange] = useState('month')

  useEffect(() => {
    let active = true

    async function load() {
      try {
        setError('')
        setLoading(true)
        const suffix = range === 'all' ? '' : `?range=${encodeURIComponent(range)}`
        const [resumen, turnosPorEspecialidad, horariosMasSolicitados, turnosPorDoctor, turnosPorMes, estadosTurnos, ingresosPorEspecialidad, turnosPorDiaSemana, ingresosPorMes, topDoctoresSolicitados] = await Promise.all([
          request(`/estadisticas/resumen${suffix}`),
          request(`/estadisticas/turnos-por-especialidad${suffix}`),
          request(`/estadisticas/horarios-mas-solicitados${suffix}`),
          request(`/estadisticas/turnos-por-doctor${suffix}`),
          request(`/estadisticas/turnos-por-mes${suffix}`),
          request(`/estadisticas/estados-turnos${suffix}`),
          request(`/estadisticas/ingresos-por-especialidad${suffix}`),
          request(`/estadisticas/turnos-por-dia-semana${suffix}`),
          request(`/estadisticas/ingresos-por-mes${suffix}`),
          request(`/estadisticas/top-doctores-solicitados${suffix}`),
        ])

        if (!active) return

        setStats({
          resumen,
          turnosPorEspecialidad,
          horariosMasSolicitados,
          turnosPorDoctor,
          turnosPorMes,
          estadosTurnos,
          ingresosPorEspecialidad,
          turnosPorDiaSemana,
          ingresosPorMes,
          topDoctoresSolicitados,
        })
      } catch (err) {
        console.error(err)
        if (!active) return
        setError('No se pudieron cargar las estadísticas del último mes.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [range])

  if (loading) {
    return (
      <section className="container py-5">
        <div className="alert alert-info">Cargando estadísticas del período seleccionado...</div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="container py-5">
        <div className="alert alert-danger">{error}</div>
      </section>
    )
  }

  const resumen = stats?.resumen?.estadisticasGenerales || {}
  const topEspecialidades = stats?.resumen?.topEspecialidades || []
  const topHorarios = stats?.resumen?.topHorarios || []
  const estados = stats?.estadosTurnos?.raw || []
  const especialidades = stats?.turnosPorEspecialidad?.raw || []
  const horarios = stats?.horariosMasSolicitados?.raw || []
  const meses = stats?.turnosPorMes?.raw || []
  const ingresosEspecialidad = stats?.ingresosPorEspecialidad?.raw || []
  const diasSemana = stats?.turnosPorDiaSemana?.raw || []
  const ingresosMes = stats?.ingresosPorMes?.raw || []
  const topDoctores = stats?.topDoctoresSolicitados?.raw || []

  return (
    <section className="container-fluid py-4 py-lg-5 px-3 px-lg-4">
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3 p-3 p-lg-4 bg-white shadow-sm rounded-4">
            <div>
              <div className="text-uppercase text-primary fw-semibold small mb-1">Filtro de período</div>
              <h5 className="fw-bold mb-0">Cambiar rango de estadísticas</h5>
            </div>
            <div className="btn-group flex-wrap" role="group" aria-label="Filtro de estadísticas">
              {statsRanges.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  className={`btn ${range === item.value ? 'btn-primary' : 'btn-outline-primary'}`}
                  onClick={() => setRange(item.value)}
                >
                  <span className="d-block fw-semibold">{item.label}</span>
                  <small className="d-block opacity-75">{item.subtitle}</small>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4 align-items-stretch mb-4">
        <div className="col-12 col-lg-8">
          <div className="p-4 p-lg-5 rounded-4 shadow-sm bg-white h-100">
            <div className="d-flex flex-column flex-lg-row justify-content-between gap-3 align-items-lg-center">
              <div>
                <div className="text-uppercase text-primary fw-semibold small mb-2">Panel de estadísticas</div>
                <h3 className="fw-bold mb-2">{statsRanges.find((item) => item.value === range)?.label || 'Último mes'}</h3>
                <p className="text-muted mb-0">Resumen operativo del sistema con el mismo enfoque funcional que Angular, ahora filtrable por período.</p>
              </div>
              <div className="text-lg-end">
                <div className="display-6 fw-bold mb-0">{Number(resumen.totalTurnos || 0)}</div>
                <div className="text-muted">Turnos analizados</div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <div className="p-4 rounded-4 shadow-sm bg-primary text-white h-100">
            <div className="small text-uppercase text-white-50 fw-semibold mb-2">Efectividad</div>
            <div className="display-6 fw-bold mb-2">{resumen.porcentajeRealizados || 0}%</div>
            <p className="mb-0 text-white-75">Proporción de turnos realizados sobre el total del período seleccionado.</p>
          </div>
        </div>
      </div>

      <div className="row g-3 mb-4">
        {[
          { label: 'Turnos pendientes', value: resumen.turnosPendientes || 0, icon: 'bi-hourglass-split', tone: 'warning' },
          { label: 'Turnos realizados', value: resumen.turnosRealizados || 0, icon: 'bi-check-circle', tone: 'success' },
          { label: 'Turnos cancelados', value: resumen.turnosCancelados || 0, icon: 'bi-x-circle', tone: 'danger' },
          { label: 'Doctores activos', value: resumen.totalDoctores || 0, icon: 'bi-people', tone: 'primary' },
          { label: 'Especialidades', value: resumen.totalEspecialidades || 0, icon: 'bi-heart-pulse', tone: 'info' },
        ].map((item) => (
          <div key={item.label} className="col-12 col-md-6 col-xl-2">
            <div className="card h-100 shadow-sm border-0 rounded-4">
              <div className="card-body p-4">
                <div className={`text-${item.tone} mb-2`}><i className={`bi ${item.icon} fs-3`} /></div>
                <div className="fs-3 fw-bold">{item.value}</div>
                <div className="text-muted small">{item.label}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-6">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3"><i className="bi bi-pie-chart text-primary me-2" />Estados de turnos</h5>
              <div className="d-grid gap-3">
                {estados.map((item) => (
                  <div key={item._id}>
                    <div className="d-flex justify-content-between small mb-1">
                      <span className="fw-semibold">{item._id}</span>
                      <span className="text-muted">{item.cantidad} turnos</span>
                    </div>
                    <div className="progress" style={{ height: '10px' }}>
                      <div className={`progress-bar bg-${item._id === 'realizado' ? 'success' : item._id === 'cancelado' ? 'danger' : 'warning'}`} style={{ width: `${Number(item.porcentaje || 0)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3"><i className="bi bi-stars text-primary me-2" />Top doctores solicitados</h5>
              <div className="list-group list-group-flush">
                {topDoctores.map((item, index) => (
                  <div key={item._id || item.doctorNombre || index} className="list-group-item px-0 d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold">Dr. {item.doctorNombre}</div>
                      <div className="small text-muted">{item.especialidad} · Matrícula {item.matricula || '-'}</div>
                    </div>
                    <span className="badge bg-primary rounded-pill">{item.totalTurnos}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3"><i className="bi bi-hospital text-primary me-2" />Turnos por especialidad</h5>
              <div className="d-grid gap-3">
                {especialidades.map((item) => {
                  const maxValue = getMaxValue(especialidades, 'totalTurnos')
                  return (
                    <div key={item._id || item.especialidad}>
                      <div className="d-flex justify-content-between small mb-1">
                        <span className="fw-semibold">{normalizeItemLabel(item)}</span>
                        <span className="text-muted">{item.totalTurnos} turnos</span>
                      </div>
                      <div className="progress" style={{ height: '10px' }}>
                        <div className="progress-bar bg-primary" style={{ width: `${(Number(item.totalTurnos || 0) / maxValue) * 100}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3"><i className="bi bi-clock-history text-primary me-2" />Horarios más solicitados</h5>
              <div className="d-grid gap-3">
                {horarios.map((item) => {
                  const maxValue = getMaxValue(horarios, 'totalTurnos')
                  return (
                    <div key={item._id}>
                      <div className="d-flex justify-content-between small mb-1">
                        <span className="fw-semibold">{item._id}</span>
                        <span className="text-muted">{item.totalTurnos} turnos</span>
                      </div>
                      <div className="progress" style={{ height: '10px' }}>
                        <div className="progress-bar bg-info" style={{ width: `${(Number(item.totalTurnos || 0) / maxValue) * 100}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3"><i className="bi bi-currency-dollar text-primary me-2" />Ingresos por especialidad</h5>
              <div className="d-grid gap-3">
                {ingresosEspecialidad.map((item) => {
                  const maxValue = getMaxValue(ingresosEspecialidad, 'ingresoTotal')
                  return (
                    <div key={item._id || item.especialidad}>
                      <div className="d-flex justify-content-between small mb-1">
                        <span className="fw-semibold">{normalizeItemLabel(item)}</span>
                        <span className="text-muted">{toCurrency(item.ingresoTotal)}</span>
                      </div>
                      <div className="progress" style={{ height: '10px' }}>
                        <div className="progress-bar bg-success" style={{ width: `${(Number(item.ingresoTotal || 0) / maxValue) * 100}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3"><i className="bi bi-calendar-week text-primary me-2" />Turnos por día</h5>
              <div className="d-grid gap-3">
                {diasSemana.map((item) => {
                  const maxValue = getMaxValue(diasSemana, 'totalTurnos')
                  return (
                    <div key={item._id}>
                      <div className="d-flex justify-content-between small mb-1">
                        <span className="fw-semibold">{item.dia || item._id}</span>
                        <span className="text-muted">{item.totalTurnos} turnos</span>
                      </div>
                      <div className="progress" style={{ height: '10px' }}>
                        <div className="progress-bar bg-warning" style={{ width: `${(Number(item.totalTurnos || 0) / maxValue) * 100}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3"><i className="bi bi-graph-up text-primary me-2" />Ingresos por mes</h5>
              <div className="d-grid gap-3">
                {ingresosMes.map((item) => {
                  const maxValue = getMaxValue(ingresosMes, 'ingresoTotal')
                  return (
                    <div key={`${item._id?.mes}-${item._id?.anio}`}>
                      <div className="d-flex justify-content-between small mb-1">
                        <span className="fw-semibold">{item._id?.mes}/{item._id?.anio}</span>
                        <span className="text-muted">{toCurrency(item.ingresoTotal)}</span>
                      </div>
                      <div className="progress" style={{ height: '10px' }}>
                        <div className="progress-bar bg-secondary" style={{ width: `${(Number(item.ingresoTotal || 0) / maxValue) * 100}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3"><i className="bi bi-calendar2-range text-primary me-2" />Turnos por mes</h5>
              <div className="d-grid gap-3">
                {meses.map((item) => {
                  const maxValue = getMaxValue(meses, 'totalTurnos')
                  return (
                    <div key={`${item._id?.mes}-${item._id?.anio}`}>
                      <div className="d-flex justify-content-between small mb-1">
                        <span className="fw-semibold">{item._id?.mes}/{item._id?.anio}</span>
                        <span className="text-muted">{item.totalTurnos} turnos</span>
                      </div>
                      <div className="progress" style={{ height: '10px' }}>
                        <div className="progress-bar bg-dark" style={{ width: `${(Number(item.totalTurnos || 0) / maxValue) * 100}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="col-12 col-xl-6">
          <div className="card shadow-sm border-0 rounded-4 h-100">
            <div className="card-body p-4">
              <h5 className="fw-bold mb-3"><i className="bi bi-list-ol text-primary me-2" />Resumen rápido</h5>
              <div className="list-group list-group-flush">
                {topEspecialidades.map((item, index) => (
                  <div key={item._id || item.especialidad || index} className="list-group-item px-0 d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold">{item.especialidad}</div>
                      <div className="small text-muted">{item.totalTurnos} turnos · {item.turnosRealizados} realizados</div>
                    </div>
                    <span className="badge bg-primary rounded-pill">#{index + 1}</span>
                  </div>
                ))}
                {topHorarios.map((item, index) => (
                  <div key={item._id || index} className="list-group-item px-0 d-flex justify-content-between align-items-center">
                    <div>
                      <div className="fw-semibold">Horario {item._id}</div>
                      <div className="small text-muted">{item.totalTurnos} turnos solicitados</div>
                    </div>
                    <span className="badge bg-secondary rounded-pill">#{index + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  )
}
