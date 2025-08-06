import React, { useEffect, useState } from 'react';
import './docentes.css';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Docentes() {
  const [docentes, setDocentes] = useState([]);
  const [opcionesMaterias, setOpcionesMaterias] = useState([]);
  const [nuevoDocente, setNuevoDocente] = useState({
    nombre: '',
    usuario: '',
    contrasena: '',
    materiaId: ''
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/materias')
      .then(res => res.json())
      .then(data => setOpcionesMaterias(data))
      .catch(err => console.error(err));

    fetch('http://localhost:5000/api/docentes')
      .then(res => res.json())
      .then(data => setDocentes(data.sort((a, b) => a.nombre.localeCompare(b.nombre))))
      .catch(err => console.error(err));
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setNuevoDocente(prev => ({ ...prev, [name]: value }));
  };

  const guardarDocente = e => {
    e.preventDefault();
    const url = editando
      ? `http://localhost:5000/api/docentes/${editando}`
      : 'http://localhost:5000/api/docentes';
    const method = editando ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoDocente)
    })
      .then(res => res.json())
      .then(() => fetch('http://localhost:5000/api/docentes'))
      .then(res => res.json())
      .then(data => {
        setDocentes(data.sort((a, b) => a.nombre.localeCompare(b.nombre)));
        setNuevoDocente({ nombre: '', usuario: '', contrasena: '', materiaId: '' });
        setEditando(null);
        setMostrarFormulario(false);
      })
      .catch(err => console.error(err));
  };

  const eliminarDocente = usuario => {
    if (!window.confirm('¿Eliminar este docente?')) return;
    fetch(`http://localhost:5000/api/docentes/${usuario}`, { method: 'DELETE' })
      .then(() => fetch('http://localhost:5000/api/docentes'))
      .then(res => res.json())
      .then(data => setDocentes(data))
      .catch(err => console.error(err));
  };

  const editarDocente = d => {
    setNuevoDocente({
      nombre: d.nombre,
      usuario: d.usuario,
      contrasena: d.contrasena,
      materiaId: d.materiaId
    });
    setEditando(d.usuario);
    setMostrarFormulario(true);
  };

  const toggleDarkMode = () => {
    document.body.classList.toggle('dark-mode');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-top">
          <img src="https://www.utacapulco.edu.mx/UTANUEVA4/img/LOGO%20UTA.png" alt="Logo" className="sidebar-logo" />
          <h2 className="sidebar-title">Sistema de Horarios</h2>
        </div>
        <nav>
          <ul>
            <li><Link to="/admin-panel">📋 Panel principal</Link></li>
            <li><Link to="/admin-panel/docentes">🧑‍🏫 Docentes</Link></li>
            <li><Link to="/admin-panel/materias">📚 Materias</Link></li>
            <li><Link to="#">🕑 Horarios</Link></li>

            <li><Link to="/">🔒 Cerrar sesión</Link></li>
          </ul>
        </nav>
        <button onClick={toggleDarkMode} className="toggle-dark-mode">🌙 Modo Oscuro</button>
      </aside>

      <motion.main
        className="admin-main"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="top-bar">
          <h2>👨‍🏫 Lista de Docentes</h2>
          <Link to="/admin-panel" className="btn-regresar">⬅️ Regresar</Link>
        </div>

        <motion.table className="tabla-docentes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <thead>
            <tr>
              <th>Nombre</th><th>Usuario</th><th>Contraseña</th><th>Materia</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {docentes.map(d => (
              <motion.tr key={d.usuario} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
                <td>{d.nombre}</td>
                <td>{d.usuario}</td>
                <td>{d.contrasena}</td>
                <td>{d.materia}</td>
                <td className="acciones">
                  <button onClick={() => editarDocente(d)}>✏️</button>
                  <button onClick={() => eliminarDocente(d.usuario)}>🗑️</button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </motion.table>

        <motion.h3 onClick={() => setMostrarFormulario(!mostrarFormulario)} style={{ cursor: 'pointer', marginTop: '1rem' }}>
          {mostrarFormulario ? '🔽 Ocultar formulario' : '➕ Agregar Nuevo Docente'}
        </motion.h3>

        {mostrarFormulario && (
          <motion.form className="form-docente" onSubmit={guardarDocente} initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.4 }}>
            <input name="nombre" placeholder="Nombre" value={nuevoDocente.nombre} onChange={handleChange} required />
            <input name="usuario" placeholder="Usuario" value={nuevoDocente.usuario} onChange={handleChange} required disabled={!!editando} />
            <input name="contrasena" type="password" placeholder="Contraseña" value={nuevoDocente.contrasena} onChange={handleChange} required />
            <select name="materiaId" value={nuevoDocente.materiaId} onChange={handleChange} required>
              <option value="" disabled>Selecciona materia</option>
              {opcionesMaterias.map(m => (
                <option key={m.id} value={m.id}>{m.carrera} – {m.materia} ({m.grupo})</option>
              ))}
            </select>
            <button type="submit">{editando ? 'Actualizar' : 'Guardar'}</button>
          </motion.form>
        )}
      </motion.main>
    </div>
  );
}