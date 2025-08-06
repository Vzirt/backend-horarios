import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './asignar.css';
import { Link } from 'react-router-dom';

const AsignarHorarios = () => {
  const [formData, setFormData] = useState({
    grupoId: '',
    cuatrimestre: '',
    carreraId: '',
    aula: ''
  });
  const [materias, setMaterias] = useState([]);
  const [asignaciones, setAsignaciones] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('asignacion');
  const [isDarkMode, setIsDarkMode] = useState(document.body.classList.contains('dark-mode'));
  const [sugerencia, setSugerencia] = useState('');


  const navigate = useNavigate();

  const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
  const HORAS = [
    "12:30-13:20", "13:20-14:10", "14:10-15:00",
    "15:00-15:10", // Receso
    "15:10-16:00", "16:00-16:50", "16:50-17:40",
    "17:40-18:30", "18:30-19:20"
  ];
  const CARRERAS = [
    { id: 1, nombre: "Gastronomía" },
    { id: 2, nombre: "Mantenimiento Industrial" },
    { id: 3, nombre: "Desarrollo y Gestión de Software" },
    { id: 4, nombre: "Innovación de Negocios y Mercadotecnia" }
  ];
  const GRUPOS = ["A", "B", "C"];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resMaterias] = await Promise.all([
          axios.get('http://localhost:5000/api/materias-con-docentes')
        ]);

        setMaterias(resMaterias.data);

        const horarioInicial = {};
        DIAS.forEach(dia => {
          HORAS.forEach(hora => {
            horarioInicial[`${dia}-${hora}`] = '';
          });
        });
        setAsignaciones(horarioInicial);
      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar datos. Por favor recarga la página.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleToggleDarkMode = () => {
    document.body.classList.toggle('dark-mode');
    setIsDarkMode(prev => !prev);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'aula' && !/^\d{0,3}$/.test(value)) return;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGuardarHorarioCompleto = async () => {
    const { grupoId, cuatrimestre, carreraId, aula } = formData;
    if (!grupoId || !cuatrimestre || !carreraId || !aula) {
      alert("Por favor completa todos los campos, incluyendo el aula.");
      return;
    }

    if (!/^\d{1,3}$/.test(aula)) {
      alert("El aula debe ser un número de hasta 3 dígitos.");
      return;
    }

    const asignacionesArray = Object.entries(asignaciones)
      .filter(([, materiaId]) => materiaId !== "")
      .map(([clave, materiaId]) => {
        const [dia, ...horaArr] = clave.split("-");
        const hora = horaArr.join("-");
        const materia = materias.find(m => m.id == materiaId);

        if (!materia) {
          throw new Error(`Materia no encontrada para ID: ${materiaId}`);
        }

        return {
          dia,
          hora,
          materia_id: materia.id,
          docente_id: materia.docente_id,
          aula,
          grupo_id: grupoId,
          cuatrimestre: parseInt(cuatrimestre),
          carrera_id: carreraId
        };
      });

    const horarioOcupado = new Set();
    const conflictos = asignacionesArray.filter(a => {
      const clave = `${a.dia}-${a.hora}`;
      if (horarioOcupado.has(clave)) return true;
      horarioOcupado.add(clave);
      return false;
    });

    if (conflictos.length > 0) {
      alert(`Hay ${conflictos.length} conflicto(s) de horario. Revisa las asignaciones.`);
      return;
    }

    try {
      setIsLoading(true);
      await axios.post("http://localhost:5000/api/asignaciones/masivo", {
        asignaciones: asignacionesArray
      });
      alert("Horario asignado con éxito!");
      navigate("/admin-panel/horarios");
    } catch (error) {
      console.error("Error al guardar horario:", error);
      alert(error.response?.data?.message || "Error al guardar horario. Verifica los datos.");
    } finally {
      setIsLoading(false);
    }
  };

  const obtenerSugerenciaIA = async () => {
  try {
    const res = await axios.post('http://localhost:5000/api/sugerencia-horario', {
      carrera: formData.carreraId,
      cuatrimestre: formData.cuatrimestre,
      grupo: formData.grupoId,
      materias: materias.map(m => ({
        materia: m.materia,
        docente: m.docente_nombre
      }))
    });
    setSugerencia(res.data.sugerencia);
  } catch (err) {
    alert("Error al obtener sugerencia de la IA.");
    console.error(err);
  }
};


  const isConflict = (dia, hora, materiaId) => {
    if (!materiaId) return false;
    const claveActual = `${dia}-${hora}`;
    return Object.entries(asignaciones)
      .filter(([k, v]) => v === materiaId && k !== claveActual)
      .some(([k]) => k.endsWith(`-${hora}`) && k.startsWith(dia));
  };

  if (isLoading) return <div className="loading-screen">Cargando horarios...</div>;
  if (error) return <div className="error-screen">{error}</div>;

  return (
    <div className="professional-container">
      <div className="admin-header">
        <div className="top-header-bar">
  <Link to="/admin-panel" className="btn-regresar">🔙 Regresar</Link>
</div>


<h1 className="animated-title">SISTEMA DE GESTIÓN DE HORARIOS</h1>

        
        <div className="admin-tabs">
          <button 
            className={`tab-button ${activeTab === 'asignacion' ? 'active' : ''}`}
            onClick={() => setActiveTab('asignacion')}
          >
            Asignación de Horarios
          </button>
        </div>
      </div>

      <div className="schedule-section">
        <div className="section-header">
          <h2>Asignar Horarios Académicos</h2>
          <p>Complete los campos y asigne materias a los horarios disponibles</p>
        </div>

        <div className="form-grid">
          <div className="form-card">
            <label className="form-label">Carrera</label>
            <select 
              name="carreraId"
              value={formData.carreraId}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="">Seleccione una carrera</option>
              {CARRERAS.map(carrera => (
                <option key={carrera.id} value={carrera.id}>
                  {carrera.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-card">
            <label className="form-label">Cuatrimestre</label>
            <select 
              name="cuatrimestre"
              value={formData.cuatrimestre}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="">Seleccione cuatrimestre</option>
              {[...Array(11)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}° Cuatrimestre</option>
              ))}
            </select>
          </div>

          <div className="form-card">
            <label className="form-label">Grupo</label>
            <select 
              name="grupoId"
              value={formData.grupoId}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="">Seleccione grupo</option>
              {GRUPOS.map((grupo, index) => (
                <option key={grupo} value={index + 1}>Grupo {grupo}</option>
              ))}
            </select>
          </div>

          <div className="form-card">
            <label className="form-label">Aula</label>
            <div className="input-with-icon">
              <input
                type="text"
                name="aula"
                value={formData.aula}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Ej. 201"
                maxLength="3"
              />
              <span className="input-icon">#</span>
            </div>
          </div>
        </div>

        <div className="schedule-container">
          <div className="table-header">
            <h3>Horario Semanal</h3>
            <div className="aula-display">
              <span>Aula asignada:</span>
              <strong>{formData.aula || '--'}</strong>
            </div>
          </div>
          
          <div className="table-responsive">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th className="time-header">Hora</th>
                  {DIAS.map(dia => (
                    <th key={dia}>{dia}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {HORAS.map(hora => (
                  <tr key={hora}>
                    <td className={`time-cell ${hora === "15:00-15:10" ? 'recess-cell' : ''}`}>
                      {hora}
                    </td>
                    {DIAS.map(dia => {
                      const clave = `${dia}-${hora}`;
                      const isReceso = hora === "15:00-15:10";
                      const value = asignaciones[clave];
                      const hasConflict = isConflict(dia, hora, value);

                      return (
                        <td 
                          key={clave} 
                          className={`
                            ${isReceso ? 'recess-cell' : ''} 
                            ${hasConflict ? 'conflict-cell' : ''}
                          `}
                        >
                          {isReceso ? (
                            <div className="recess-label">RECESO</div>
                          ) : (
                            <select
                              value={value}
                              onChange={(e) =>
                                setAsignaciones({
                                  ...asignaciones,
                                  [clave]: e.target.value
                                })
                              }
                              className="schedule-select"
                            >
                              <option value="">Seleccionar</option>
                              {materias.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.materia} - {m.docente_nombre}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="form-actions">
          <button 
            onClick={handleGuardarHorarioCompleto}
            className="primary-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Guardando...
              </>
            ) : (
              'Guardar Horario Completo'
            )}
          </button>
          <div className="form-actions">
  <button className="primary-button" onClick={obtenerSugerenciaIA}>
    🤖 Sugerir Horario con IA
  </button>
</div>

{sugerencia && (
  <div className="sugerencia-box">
    <h4>Horario sugerido por IA:</h4>
    <pre>{sugerencia}</pre>
  </div>
)}
        </div>
      </div>
    </div>
  );
};

export default AsignarHorarios;