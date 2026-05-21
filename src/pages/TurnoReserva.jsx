import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import DatePicker, { registerLocale } from 'react-datepicker'
import { es } from 'date-fns/locale/es'
import { useToast } from '../App'
import { request } from '../services/api'
import { createTurno, getTurnosByDoctorFecha, getTurnosByPaciente } from '../services/turnoService'
import { createPreference } from '../services/pagoService'
import { getDoctorById } from '../services/doctorService'
import 'react-datepicker/dist/react-datepicker.css'

const startHour = 13
const endHour = 20

registerLocale('es', es)

function toDisplayDate(date) {
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export default function TurnoReserva({ idPaciente: propPacienteId, idDoctor: propDoctorId, onSuccess }) {
  const params = useParams()
  const idPaciente = propPacienteId || params.idPaciente
  const idDoctor = propDoctorId || params.idDoctor
  const navigate = useNavigate()
  const location = useLocation()
  const { pushToast } = useToast()

  const [doctor, setDoctor] = useState(null)
  const [turnosPorFecha, setTurnosPorFecha] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingDisponibilidad, setLoadingDisponibilidad] = useState(false)
  const [botonPagoDeshabilitado, setBotonPagoDeshabilitado] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedHour, setSelectedHour] = useState(null)
  const [observaciones, setObservaciones] = useState(location.state?.observaciones || '')

  const horas = useMemo(() => Array.from({ length: endHour - startHour + 1 }, (_, index) => `${startHour + index}:00`), [])

  useEffect(() => {
    let active = true

    async function loadDoctor() {
      setLoading(true)
      try {
        const data = await getDoctorById(idDoctor)
        if (!active) return
        setDoctor(data)
      } catch (error) {
        pushToast({ variant: 'danger', title: 'Error', message: 'No se pudo cargar el doctor' })
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDoctor()

    return () => {
      active = false
    }
  }, [idDoctor, pushToast])

  useEffect(() => {
    if (!selectedDate) return

    let active = true
    async function loadAvailability() {
      setLoadingDisponibilidad(true)
      try {
        const disponibilidad = await getTurnosByDoctorFecha(idDoctor, toDisplayDate(selectedDate))
        if (!active) return
        setTurnosPorFecha(Array.isArray(disponibilidad) ? disponibilidad : [])
        setSelectedHour(null)
      } catch (error) {
        if (active) {
          setTurnosPorFecha([])
          pushToast({ variant: 'danger', title: 'Error', message: 'No se pudo consultar la disponibilidad' })
        }
      } finally {
        if (active) setLoadingDisponibilidad(false)
      }
    }

    loadAvailability()
    return () => {
      active = false
    }
  }, [idDoctor, pushToast, selectedDate])

  const today = new Date()
  const maxDate = new Date(today)
  maxDate.setMonth(maxDate.getMonth() + 2)

  const isDisabled = (date) => {
    const isBeforeToday = date < new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const isBeyondTwoMonths = date > maxDate
    return isBeforeToday || isWeekend || isBeyondTwoMonths
  }

  const deshabilitarHora = (hora) => {
    const ocupada = turnosPorFecha.some((turno) => turno.hora === hora)

    if (!selectedDate) return true

    const hoy = new Date()
    if (sameDay(selectedDate, hoy)) {
      const [horaNum] = hora.split(':').map(Number)
      if (horaNum <= hoy.getHours()) return true
    }

    return ocupada
  }

  const onDateSelect = (date) => {
    if (!date || isDisabled(date)) return
    setSelectedDate(date)
  }

  const validate = () => {
    if (!selectedDate) return 'Debe seleccionar una fecha'
    if (!selectedHour) return 'Debe seleccionar una hora'
    return null
  }

  const getNextAvailableDate = (baseDate) => {
    const next = new Date(baseDate)
    while (next.getDay() === 0 || next.getDay() === 6) {
      next.setDate(next.getDate() + 1)
    }
    return next
  }

  const reservarTurno = async (metodo) => {
    const error = validate()
    if (error) {
      pushToast({ variant: 'warning', title: 'Validación', message: error })
      return
    }

    setBotonPagoDeshabilitado(true)
    try {
      const payload = {
        fecha: toDisplayDate(selectedDate),
        hora: selectedHour,
        observaciones,
      }

      // Prevent patient from creating duplicate turno on same date & hour
      try {
        const pacienteTurnos = await getTurnosByPaciente(idPaciente)
        const fechaStr = payload.fecha
        const duplicado = Array.isArray(pacienteTurnos) && pacienteTurnos.some((t) => t.fecha === fechaStr && t.hora === payload.hora)
        if (duplicado) {
          pushToast({ variant: 'warning', title: 'Duplicado', message: 'Ya tienes un turno en esa fecha y hora.' })
          setBotonPagoDeshabilitado(false)
          return
        }
      } catch (errCheck) {
        // ignore check errors, proceed to try create
      }

      // Re-check doctor availability to avoid race conditions
      try {
        const disponibilidad = await getTurnosByDoctorFecha(idDoctor, payload.fecha)
        const ocupada = Array.isArray(disponibilidad) && disponibilidad.some((t) => t.hora === payload.hora)
        if (ocupada) {
          pushToast({ variant: 'warning', title: 'No disponible', message: 'La hora ya fue ocupada. Por favor, elige otra franja.' })
          setBotonPagoDeshabilitado(false)
          return
        }
      } catch (errCheck2) {
        // ignore
      }

      const turno = await createTurno(idPaciente, idDoctor, payload)

      if (metodo === 'mercadopago') {
        const preference = await createPreference(idDoctor, turno._id, {})
        if (preference?.init_point) {
          window.location.href = preference.init_point
          return
        }
        throw new Error('No se pudo crear la preferencia de pago')
      }

      await request('/pagos', {
        method: 'POST',
        body: {
          monto: doctor?.precioConsulta || 0,
          metodoPago: 'transferencia',
          turno: turno._id,
        },
      })
      pushToast({ variant: 'success', title: 'Turno reservado', message: 'Reserva creada correctamente con pago por transferencia/efectivo.' })
      if (typeof onSuccess === 'function') return onSuccess(turno)
      navigate(`/paciente/${idPaciente}`)
    } catch (err) {
      console.error(err)
      pushToast({ variant: 'danger', title: 'Error', message: err?.message || 'No se pudo reservar el turno' })
      setBotonPagoDeshabilitado(false)
    } finally {
      setBotonPagoDeshabilitado(false)
    }
  }

  const goToTodayMonth = () => setSelectedDate(getNextAvailableDate(new Date()))

  if (loading) {
    return <section className="container py-5"><div className="alert alert-info">Cargando reserva de turno...</div></section>
  }

  return (
    <section className="container mt-4 mb-5">
      <div className="row justify-content-center">
        <div className="col-md-10 col-lg-9 col-xl-8">
          <div className="w-100 d-flex justify-content-end mb-3">
            <button className="btn btn-secondary" type="button" onClick={() => navigate(`/paciente/${idPaciente}`)} title="Volver al perfil del paciente">
              <i className="bi bi-arrow-left me-2" /> Volver
            </button>
          </div>

          <div className="card shadow-sm border-0 overflow-hidden">
            <div className="card-header d-flex justify-content-between align-items-center bg-white border-bottom">
              <div className="text-start">
                <h5 className="mb-0">Reservar Turno</h5>
                <small className="text-muted">Dr. {doctor?.nombre} {doctor?.apellido} · {doctor?.especialidad?.nombre || 'Sin especialidad'}</small>
              </div>
              <span className="badge bg-success fs-6">${doctor?.precioConsulta?.toLocaleString('es-AR') || 0}</span>
            </div>

            <div className="card-body">
              <div className="row g-4">
                <div className="col-12 col-lg-6 text-center text-lg-start">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0">📅 Seleccionar fecha</h6>
                    <button className="btn btn-outline-secondary btn-sm" type="button" onClick={goToTodayMonth}>Hoy</button>
                  </div>

                  <div className="calendar-shell border rounded-4 p-3 bg-light">
                    <DatePicker
                      inline
                      locale="es"
                      selected={selectedDate}
                      onChange={onDateSelect}
                      minDate={today}
                      maxDate={maxDate}
                      filterDate={(date) => {
                        const dayOfWeek = date.getDay()
                        return dayOfWeek !== 0 && dayOfWeek !== 6
                      }}
                      renderCustomHeader={({ date, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled }) => (
                        <div className="d-flex justify-content-between align-items-center mb-3 px-1">
                          <button className="btn btn-outline-primary btn-sm" type="button" onClick={decreaseMonth} disabled={prevMonthButtonDisabled}>
                            <i className="bi bi-chevron-left" />
                          </button>
                          <div className="fw-bold text-primary text-capitalize">
                            {date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
                          </div>
                          <button className="btn btn-outline-primary btn-sm" type="button" onClick={increaseMonth} disabled={nextMonthButtonDisabled}>
                            <i className="bi bi-chevron-right" />
                          </button>
                        </div>
                      )}
                      calendarClassName="turno-calendar"
                      dayClassName={(date) => {
                        if (selectedDate && sameDay(date, selectedDate)) return 'turno-calendar-day-selected'
                        return ''
                      }}
                    />
                  </div>
                </div>

                <div className="col-12 col-lg-6">
                  <h6 className="mb-3 text-center text-lg-start">⏰ Seleccionar hora</h6>

                  {!selectedDate ? (
                    <div className="alert alert-warning py-2">
                      <small><i className="bi bi-info-circle me-1" /> Primero selecciona una fecha</small>
                    </div>
                  ) : (
                    <>
                      {loadingDisponibilidad ? (
                        <div className="alert alert-info py-2">Cargando turnos disponibles...</div>
                      ) : (
                        <div className="row g-2 d-sm-flex">
                          {horas.map((hora) => (
                            <div className="col-6" key={hora}>
                              <button
                                type="button"
                                className={`btn btn-sm w-100 ${selectedHour === hora ? 'btn-primary' : 'btn-outline-primary'}`}
                                onClick={() => setSelectedHour(hora)}
                                disabled={deshabilitarHora(hora)}
                              >
                                {hora}
                                {deshabilitarHora(hora) && <i className="bi bi-lock-fill text-muted ms-1" title="Hora no disponible" />}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {selectedDate && selectedHour && (
                <div className="mt-4 text-center">
                  <hr />
                  <div className="alert alert-primary py-2 mb-3">
                    <strong>Turno:</strong> {selectedDate.getDate()}/{selectedDate.getMonth() + 1}/{selectedDate.getFullYear()} a las {selectedHour}
                  </div>


                  <h6 className="mb-3">💳 Selecciona tu método de pago</h6>
                  <div className="row g-2 justify-content-center">
                    <div className="col-12 col-sm-6">
                      <button className="btn btn-primary w-100 position-relative" type="button" onClick={() => reservarTurno('mercadopago')} disabled={botonPagoDeshabilitado}>
                        <i className="bi bi-credit-card me-2" /> MercadoPago
                        {botonPagoDeshabilitado && <span className="spinner-border spinner-border-sm position-absolute top-50 end-0 translate-middle-y me-3" role="status" aria-hidden="true" />}
                      </button>
                    </div>
                    <div className="col-12 col-sm-6">
                      <button className="btn btn-success w-100 position-relative" type="button" onClick={() => reservarTurno('transferencia')} disabled={botonPagoDeshabilitado}>
                        <i className="bi bi-bank me-2" /> Transferencia / Efectivo
                        {botonPagoDeshabilitado && <span className="spinner-border spinner-border-sm position-absolute top-50 end-0 translate-middle-y me-3" role="status" aria-hidden="true" />}
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 text-start">
                    <div className="alert alert-info mb-2">
                      <small className="text-muted d-block"><i className="bi bi-info-circle me-1" /> <strong>Mercado Pago:</strong> Si el pago es rechazado deberá volver a reservar el turno.</small>
                      <small className="text-muted d-block"><i className="bi bi-info-circle me-1" /> <strong>Transferencia:</strong> Deberás enviar el comprobante de pago en tu turno registrado.</small>
                      <small className="text-muted d-block"><i className="bi bi-clock me-1" /> <strong>Importante:</strong> Tenés 24hs para completar el pago y confirmar tu reserva.</small>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
