import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Login      from './pages/Login';
import AdminPanel from './pages/AdminPanel';
import Docentes   from './pages/Docentes';
import Materias   from './pages/Materias';
import Horarios   from './pages/Horarios';
import AsignarHorarios from './pages/AsignarHorarios';

import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/"                     element={<Login />} />
        <Route path="/admin-panel"          element={<AdminPanel />} />
        <Route path="/admin-panel/docentes" element={<Docentes />} />
        <Route path="/admin-panel/materias" element={<Materias />} />
        <Route path="/admin-panel/horarios" element={<Horarios />} />
        <Route path="/admin-panel/asignar-horarios" element={<AsignarHorarios />} />
      </Routes>
    </Router>
  );
}

export default App;
