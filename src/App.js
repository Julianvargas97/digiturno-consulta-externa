import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import PatientArrival from "./PatientArrival";
import Facturacion from "./Facturacion";
import CallPacientes from "./Call-pacientes"; 


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/PatientArrival" element={<PatientArrival />} />
        <Route path="/facturacion" element={<Facturacion />} />
        <Route path="/call-pacientes" element={<CallPacientes />} /> 
        <Route path="*" element={<Navigate to="/call-pacientes" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
