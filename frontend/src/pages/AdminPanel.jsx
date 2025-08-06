// AdminPanel.jsx MODIFICADO con modo oscuro
import React, { useEffect, useState } from 'react';
import './admin.css';
import { Link, useNavigate } from 'react-router-dom';

function AdminPanel() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(savedMode);
    document.body.classList.toggle('dark-mode', savedMode);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
    document.body.classList.toggle('dark-mode', newMode);
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-top">
          <img
            src="https://www.utacapulco.edu.mx/UTANUEVA4/img/LOGO%20UTA.png"
            alt="Logo Universidad"
            className="sidebar-logo"
          />
          <h2 className="sidebar-title">Sistema de Horarios</h2>
        </div>

        <nav>
          <ul>
            <li><Link to="/admin-panel">📋 Panel principal</Link></li>
            <li><Link to="/admin-panel/docentes">🧑‍🏫 Docentes</Link></li>
            <li><Link to="/admin-panel/materias">📚 Materias</Link></li>
            <li><Link to="/asignaciones/historial-completo">🕑 Horarios</Link></li>
            <li><Link to="/">🔒 Cerrar sesión</Link></li>
          </ul>
        </nav>

        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button onClick={toggleDarkMode} className="dark-toggle">
            {darkMode ? '☀️ Modo Día' : '🌙 Modo Oscuro'}
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <h1>Bienvenido, administrador</h1>
        <p>Administra y gestiona el sistema de horarios académicos de forma eficiente.</p>

        <div className="admin-cards">
          <div className="card" onClick={() => navigate('/admin-panel/docentes')}>
            <h3>👨‍🏫 Docentes</h3>
            <p>Gestiona profesores registrados en el sistema.</p>
          </div>
          <div className="card" onClick={() => navigate('/admin-panel/materias')}>
            <h3>📘 Materias</h3>
            <p>Agrega, edita o elimina asignaturas.</p>
          </div>
          <div className="card" onClick={() => navigate('/admin-panel/asignar-horarios')}>
            <h3>🗓️ Asiganción de Horarios</h3>
            <p>Visualiza y administra la asignación de horarios.</p>
          </div>
          <div className="card" onClick={() => navigate('/admin-panel/horarios')}>
            <h3>🗓️ Horarios</h3>
            <p>Visualiza y administra la asignación de horarios.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminPanel;