import React, { useState, useEffect } from 'react';
import './materias.css';
import { motion } from 'framer-motion';

const API_BASE = 'http://localhost:5000/api';

export default function Materias() {
  const [materias, setMaterias] = useState([]);
  const [form, setForm] = useState({ carrera: '', materia: '', grupo: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_BASE}/materias`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        setMaterias(data);
      } catch (err) {
        alert('No se pudieron cargar las materias. Revisa la consola.');
      }
    }
    load();
  }, []);

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const url = isEditing ? `${API_BASE}/materias/${editId}` : `${API_BASE}/materias`;
    const method = isEditing ? 'PUT' : 'POST';
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const listRes = await fetch(`${API_BASE}/materias`);
      const listData = await listRes.json();
      setMaterias(listData);
      setForm({ carrera: '', materia: '', grupo: '' });
      setIsEditing(false);
      setEditId(null);
      setShowForm(false);
    } catch (err) {
      alert('Error al guardar la materia');
    }
  };

  const handleEdit = m => {
    setForm({ carrera: m.carrera, materia: m.materia, grupo: m.grupo });
    setIsEditing(true);
    setEditId(m.id);
    setShowForm(true);
  };

  const handleDelete = async id => {
    if (!window.confirm('¿Eliminar esta materia?')) return;
    try {
      const res = await fetch(`${API_BASE}/materias/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const listRes = await fetch(`${API_BASE}/materias`);
      const listData = await listRes.json();
      setMaterias(listData);
    } catch (err) {
      alert('Error al eliminar la materia');
    }
  };

  const toggleDarkMode = () => {
    document.body.classList.toggle('dark-mode');
  };

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="sidebar-top">
          <img
            src="https://www.utacapulco.edu.mx/UTANUEVA4/img/LOGO%20UTA.png"
            alt="Logo"
            className="sidebar-logo"
          />
          <h2 className="sidebar-title">Sistema de Horarios</h2>
        </div>
        <nav>
          <ul>
            <li><a href="/admin-panel">📋 Panel principal</a></li>
            <li><a href="/admin-panel/docentes">🧑‍🏫 Docentes</a></li>
            <li><a href="/admin-panel/materias">📚 Materias</a></li>
            <li><a href="#">🕑 Horarios</a></li>
            <li><a href="/">🔒 Cerrar sesión</a></li>
          </ul>
        </nav>
        <button onClick={toggleDarkMode} className="toggle-dark-mode">🌙 Modo Oscuro</button>
      </aside>

      <motion.main className="admin-main" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}>
        <div className="materias-container">

          <div className="top-bar">
            <h2>📚 Materias</h2>
            <a href="/admin-panel" className="btn-regresar">⬅️ Regresar</a>
          </div>

          <div className="materias-header">
            <button onClick={() => setShowForm(prev => !prev)}>
              {showForm ? 'Cancelar' : '➕ Agregar Materia'}
            </button>
          </div>

          {showForm && (
            <motion.form
              className="materias-form"
              onSubmit={handleSubmit}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <input name="carrera" placeholder="Carrera" value={form.carrera} onChange={handleChange} required />
              <input name="materia" placeholder="Nombre de la materia" value={form.materia} onChange={handleChange} required />
              <input name="grupo" placeholder="Grupo (ej. 3-B)" value={form.grupo} onChange={handleChange} required />
              <button type="submit">{isEditing ? 'Actualizar' : 'Guardar'}</button>
            </motion.form>
          )}

          <motion.table className="materias-table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <thead>
              <tr>
                <th>Carrera</th>
                <th>Materia</th>
                <th>Grupo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {materias.length === 0 ? (
                <tr>
                  <td colSpan="4" className="materias-empty">No hay materias disponibles</td>
                </tr>
              ) : (
                materias.map(m => (
                  <tr key={m.id}>
                    <td>{m.carrera}</td>
                    <td>{m.materia}</td>
                    <td>{m.grupo}</td>
                    <td className="acciones">
                      <button onClick={() => handleEdit(m)}>✏️</button>
                      <button onClick={() => handleDelete(m.id)}>🗑️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </motion.table>
        </div>
      </motion.main>
    </div>
  );
}