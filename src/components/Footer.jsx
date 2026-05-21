import React from 'react'
import { NavLink } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="app-footer mt-auto bg-dark text-white">
      <div className="container py-4 py-md-5">
        <div className="row g-4 align-items-center d-none d-md-flex">
          <div className="col-md-4">
            <div className="d-flex align-items-center gap-3">
              <div className="footer-mark rounded-circle bg-white text-dark d-flex align-items-center justify-content-center fw-bold">CL</div>
              <div>
                <h6 className="mb-0 fw-bold">CONSULTORIOS LAVALLE</h6>
                <small className="text-white-50">Tu salud, nuestra prioridad</small>
              </div>
            </div>
          </div>
          <div className="col-md-4 text-center">
            <div className="d-flex justify-content-center gap-4 flex-wrap">
              <NavLink to="/doctores" className="footer-link small">Profesionales</NavLink>
              <NavLink to="/especialidades" className="footer-link small">Especialidades</NavLink>
              <NavLink to="/login" className="footer-link small">Turnos</NavLink>
            </div>
          </div>
          <div className="col-md-4 text-end">
            <div className="d-flex flex-column align-items-end gap-1">
              <a href="tel:+5493884234567" className="footer-link small"><i className="bi bi-telephone me-1" /> (0388) 423-4567</a>
              <a href="mailto:info@consultorioslavalle.com" className="footer-link small"><i className="bi bi-envelope me-1" /> Contacto</a>
            </div>
          </div>
        </div>

        <div className="d-md-none text-center">
          <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
            <div className="footer-mark rounded-circle bg-white text-dark d-flex align-items-center justify-content-center fw-bold">CL</div>
            <div>
              <h6 className="mb-0 fw-bold">CONSULTORIOS LAVALLE</h6>
              <small className="text-white-50">Tu salud, nuestra prioridad</small>
            </div>
          </div>
          <div className="d-flex justify-content-center gap-3 mb-3 flex-wrap">
            <NavLink to="/doctores" className="footer-link small">Profesionales</NavLink>
            <NavLink to="/especialidades" className="footer-link small">Especialidades</NavLink>
            <NavLink to="/login" className="footer-link small">Turnos</NavLink>
          </div>
          <div className="d-flex justify-content-center gap-3 flex-wrap small">
            <a href="tel:+5493884234567" className="footer-link"><i className="bi bi-telephone me-1" /> Llamar</a>
            <a href="mailto:info@consultorioslavalle.com" className="footer-link"><i className="bi bi-envelope me-1" /> Contacto</a>
          </div>
        </div>

        <hr className="border-white border-opacity-25 my-4" />

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-2 small text-white-50">
          <span>© 2025 Consultorios Lavalle. Todos los derechos reservados.</span>
          <span>Desarrollado por Equipo Dev Grupo 03</span>
        </div>
      </div>
    </footer>
  )
}
