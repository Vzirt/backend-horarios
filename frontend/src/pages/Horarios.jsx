// Horarios.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './horarios.css';
import { Link } from 'react-router-dom';

const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const horas = [
  "12:30-13:20", "13:20-14:10", "14:10-15:00",
  "15:00-15:10",
  "15:10-16:00", "16:00-16:50", "16:50-17:40",
  "17:40-18:30", "18:30-19:20"
];

export default function Horarios() {
  const [horariosAgrupados, setHorariosAgrupados] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [cuatrimestres] = useState([1,2,3,4,5,6,7,8,9,10,11]);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [materias, setMaterias] = useState([]);

  const [filtros, setFiltros] = useState({
    carrera_id: '', grupo_id: '', cuatrimestre: ''
  });

  useEffect(() => {
    axios.get('http://localhost:5000/api/carreras').then(res => setCarreras(res.data));
    axios.get('http://localhost:5000/api/grupos').then(res => setGrupos(res.data));
    axios.get('http://localhost:5000/api/materias-con-docentes').then(res => setMaterias(res.data));
  }, []);

  useEffect(() => {
    const fetchHorarios = async () => {
      try {
        const { carrera_id, grupo_id, cuatrimestre } = filtros;
        const endpoint = (carrera_id && grupo_id && cuatrimestre)
          ? 'http://localhost:5000/api/asignaciones/horario-filtrado'
          : 'http://localhost:5000/api/asignaciones/historial-completo';

        const res = await axios.get(endpoint, {
          params: carrera_id && grupo_id && cuatrimestre ? { carrera_id, grupo_id, cuatrimestre } : {}
        });

        const agrupados = {};
        res.data.forEach((asig) => {
          const clave = `${asig.carrera} - ${asig.cuatrimestre}° - Grupo ${asig.grupo} - Aula ${asig.aula}`;
          if (!agrupados[clave]) agrupados[clave] = [];
          agrupados[clave].push(asig);
        });

        setHorariosAgrupados(agrupados);
      } catch (error) {
        console.error("Error al cargar horarios:", error);
      }
    };

    fetchHorarios();
  }, [filtros]);

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const actualizarSlot = (dia, hora, materiaId) => {
    const clave = Object.keys(horariosAgrupados)[0];
    const materiaSeleccionada = materias.find(m => m.id === parseInt(materiaId));

    setHorariosAgrupados(prev => {
      const copia = { ...prev };
      const datos = copia[clave].map(asig => ({ ...asig }));
      const index = datos.findIndex(a => a.dia === dia && a.hora === hora);

      const nuevaAsignacion = {
        dia,
        hora,
        materia: materiaSeleccionada?.materia || '',
        docente: materiaSeleccionada?.docente_nombre || '',
        aula: datos[index]?.aula || ''
      };

      if (index !== -1) {
        datos[index] = { ...datos[index], ...nuevaAsignacion };
      } else {
        datos.push(nuevaAsignacion);
      }

      copia[clave] = datos;
      return copia;
    });
  };

  const guardarCambios = async () => {
    try {
      const clave = Object.keys(horariosAgrupados)[0];
      const datos = horariosAgrupados[clave];
      await axios.put('http://localhost:5000/api/asignaciones/editar-masivo', { asignaciones: datos });
      alert('Horario actualizado.');
      setModoEdicion(false);
    } catch (err) {
      console.error(err);
      alert('Error al guardar cambios.');
    }
  };

  return (
    <div className="contenedor-horarios">
      <h1>HISTORIAL DE HORARIOS GUARDADOS</h1>

      <div className="top-bar">
        <h2> </h2>
        <Link to="/admin-panel" className="btn-regresar">⬅️ Regresar</Link>
      </div>

      <div className="filtros-horarios">
        <select name="carrera_id" value={filtros.carrera_id} onChange={handleFiltroChange}>
          <option value="">-- Seleccionar Carrera --</option>
          {carreras.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>

        <select name="grupo_id" value={filtros.grupo_id} onChange={handleFiltroChange}>
          <option value="">-- Seleccionar Grupo --</option>
          {grupos.map(g => <option key={g.id} value={g.id}>{g.nombre}</option>)}
        </select>

        <select name="cuatrimestre" value={filtros.cuatrimestre} onChange={handleFiltroChange}>
          <option value="">-- Seleccionar Cuatrimestre --</option>
          {cuatrimestres.map(c => <option key={c} value={c}>{c}°</option>)}
        </select>
      </div>

      {Object.entries(horariosAgrupados).map(([titulo, asignaciones], index) => {
        const tabla = {};
        let carrera = '', grupo = '', cuatrimestre = '', aula = '';

        asignaciones.forEach((a) => {
          if (!tabla[a.dia]) tabla[a.dia] = {};
          tabla[a.dia][a.hora] = { materia: a.materia, docente: a.docente, aula: a.aula };
          carrera = a.carrera;
          grupo = a.grupo;
          cuatrimestre = a.cuatrimestre;
          aula = a.aula;
        });

        return (
          <div key={index} className="historial-horario">
            <div className="cabecera-horario formal">
              <img src="/Logo_SEG.png" alt="Logo SEG" className="logo-izquierdo" />
              <div className="info-horario">
                <h3>SECRETARÍA DE</h3>
                <h2 style={{ color: '#E74C3C', margin: 0 }}>EDUCACIÓN</h2>
                <h2 style={{ color: '#E74C3C', margin: 0 }}>GUERRERO</h2>
                <h1 style={{ fontSize: "1.4rem", marginTop: '0.6rem' }}>UNIVERSIDAD TECNOLÓGICA DE ACAPULCO</h1>
                <p>CUATRIMESTRE MAYO - AGOSTO 2025</p>
                <p>{carrera ? carrera.toUpperCase() : ''}</p>
                <p>GRUPO {cuatrimestre}° {grupo ? grupo.toUpperCase() : ''} - AULA {aula}</p>
              </div>
              <img src="/UTA.png" alt="Logo UTA" className="logo-derecho" />
            </div>

            <button className="btn-editar-horario" onClick={() => setModoEdicion(!modoEdicion)}>
              {modoEdicion ? 'Cancelar' : '🛠 Editar Horario'}
            </button>

            <table className="horario-grid">
              <thead>
                <tr>
                  <th>Hora / Día</th>
                  {dias.map((d) => <th key={d}>{d}</th>)}
                </tr>
              </thead>
              <tbody>
                {horas.map((hora) => (
                  <tr key={hora}>
                    <td><strong>{hora}</strong></td>
                    {dias.map((dia) => {
                      if (hora === "15:00-15:10") {
                        return (
                          <td key={dia + hora} style={{ backgroundColor: '#145A32', color: 'white', fontStyle: 'italic' }}>
                            RECESO
                          </td>
                        );
                      }
                      const slot = tabla[dia]?.[hora] || {};
                      return (
                        <td key={dia + hora}>
                          {modoEdicion ? (
                            <select
                              value={materias.find(m => m.materia === slot.materia && m.docente_nombre === slot.docente)?.id || ''}
                              onChange={(e) => actualizarSlot(dia, hora, e.target.value)}
                            >
                              <option value="">Seleccionar</option>
                              {materias.map((m) => (
                                <option key={m.id} value={m.id}>{`${m.materia} - ${m.docente_nombre}`}</option>
                              ))}
                            </select>
                          ) : (
                            slot.materia ? (
                              <>
                                <div className="materia">{slot.materia}</div>
                                <div className="docente">{slot.docente}</div>
                                <div className="aula">Aula {slot.aula}</div>
                              </>
                            ) : <div className="empty-cell">---</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>

            {modoEdicion && (
              <div className="acciones-edicion">
                <button className="btn-guardar" onClick={guardarCambios}>💾 Guardar Cambios</button>
                <button className="btn-cancelar" onClick={() => setModoEdicion(false)}>❌ Cancelar</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
