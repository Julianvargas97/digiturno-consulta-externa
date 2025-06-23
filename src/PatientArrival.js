import React, { useEffect, useState } from "react";
import useSocket, { DestSocket } from "./useSocket";
import "./PatientArrival.css";

export const API_BASE_URL = "http://192.168.137.155:5000/api/external-consultation";

function PatientArrival() {
  const [paciente, setPaciente] = useState({
    nombre: "",
    cedula: "",
    especialidad: ""
  });
  const [especialidades, setEspecialidades] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchEspecialidades() {
      try {
        const res = await fetch(`${API_BASE_URL}/specialities`);
        if (!res.ok) throw new Error("Error cargando especialidades");
        const data = await res.json();
        setEspecialidades(data);
      } catch (error) {
        console.error("Error al cargar las especialidades:", error.message);
        setMensajeConfirmacion("No se pudieron cargar las especialidades");
      }
    }

    async function fetchModulos() {
      try {
        const res = await fetch(`${API_BASE_URL}/available-modules`);
        if (!res.ok) throw new Error("Error cargando módulos");
        const data = await res.json();
        setModulos(data);
      } catch (error) {
        console.error("Error al cargar los módulos:", error.message);
        setMensajeConfirmacion("No se pudieron cargar los módulos");
      }
    }

    fetchEspecialidades();
    fetchModulos();
  }, []);

  const obtenerModuloPorEspecialidad = (esp) => {
    return modulos.find((modulo) =>
      modulo.availableSpecialities.includes(esp)
    );
  };

  const moduloAsignado = obtenerModuloPorEspecialidad(paciente.especialidad);

  // No uso sendMessage para evitar warning
  useSocket(
    DestSocket[`ExternalConsultationArrival_${paciente.especialidad}`] || DestSocket.ARRIVAL
  );

  const limpiarCampo = (campo) => {
    setPaciente((prev) => ({
      ...prev,
      [campo]: ""
    }));
    setMensajeConfirmacion("");
  };

  const confirmarLlegada = async () => {
    const { nombre, cedula, especialidad } = paciente;

    if (!nombre.trim() || !cedula.trim() || !especialidad) {
      alert("Por favor completa todos los campos");
      return;
    }

    if (!moduloAsignado) {
      alert("No se encontró un módulo para esta especialidad.");
      return;
    }

    
    setLoading(true);

    const now = new Date();
    const horaFormatoLocalTime = now.toTimeString().slice(0, 5);

    const dataToSend = {
      id: parseInt(cedula.trim(), 10),
      speciality: especialidad,
      arrivalTime: horaFormatoLocalTime,
      attentionTime: null,
      endAttentionTime: null,
      patientName: nombre.trim(),
      patientId: cedula.trim(),
      turn: null,
      attentionModule: moduloAsignado?.moduleName || null,
      state: "ARRIVAL",
      receptionName: null,
    };

    console.log("📤 Enviando al backend:", dataToSend);
    console.log("🔍 JSON enviado al backend:\n", JSON.stringify(dataToSend, null, 2));

    try {
      const res = await fetch(`${API_BASE_URL}/arrival`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSend),
      });

      if (!res.ok) {
        // Intentamos obtener mensaje de error del backend si viene JSON
        let errorMessage = "Error al confirmar llegada";
        try {
          const errorData = await res.json();
          if (errorData && errorData.message) errorMessage = errorData.message;
        } catch {
          // no hacer nada si no se puede parsear JSON
        }
        throw new Error(errorMessage);
      }

      const jsonData = await res.json();

      setMensajeConfirmacion(
        `✅ Llegada confirmada para ${jsonData.patientName}. Su turno asignado es: ${jsonData.turn}`
      );

      setPaciente({
        nombre: "",
        cedula: "",
        especialidad: ""
      });

    } catch (error) {
      console.error("Error en la confirmación de llegada:", error);
      alert("Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mensajeConfirmacion) return;
    const timer = setTimeout(() => setMensajeConfirmacion(""), 5000);
    return () => clearTimeout(timer);
  }, [mensajeConfirmacion]);

  return (
    <div className="recepcion-container">
      <h1>Confirmar llegada paciente</h1>

      <div className="formulario">
        <label>Nombre completo:</label>
        <div className="input-container">
          <input
            type="text"
            value={paciente.nombre}
            onChange={(e) => setPaciente({ ...paciente, nombre: e.target.value })}
            placeholder="Nombre completo"
            disabled={loading}
          />
          {paciente.nombre && !loading && (
            <button className="borrar-btn" onClick={() => limpiarCampo("nombre")}>
              &times;
            </button>
          )}
        </div>

        <label>Cédula:</label>
        <div className="input-container">
          <input
            type="text"
            value={paciente.cedula}
            onChange={(e) => setPaciente({ ...paciente, cedula: e.target.value })}
            placeholder="Número de cédula"
            disabled={loading}
          />
          {paciente.cedula && !loading && (
            <button className="borrar-btn" onClick={() => limpiarCampo("cedula")}>
              &times;
            </button>
          )}
        </div>

        <label>Especialidad:</label>
        <div className="input-container">
          <select
            value={paciente.especialidad}
            onChange={(e) => setPaciente({ ...paciente, especialidad: e.target.value })}
            disabled={loading}
          >
            <option value="">-- Seleccione especialidad --</option>
            {especialidades.map((esp, i) => (
              <option key={i} value={esp}>
                {esp}
              </option>
            ))}
          </select>
          {paciente.especialidad && !loading && (
            <button className="borrar-btn" onClick={() => limpiarCampo("especialidad")}>
              &times;
            </button>
          )}
        </div>

        <button
          className="confirmar-btn"
          onClick={confirmarLlegada}
          disabled={loading}
          style={{ position: "relative" }}
        >
          {loading ? <div className="spinner"></div> : "Confirmar llegada"}
        </button>
      </div>

      {mensajeConfirmacion && (
        <div className="mensaje-confirmacion">
          <button className="cerrar-mensaje" onClick={() => setMensajeConfirmacion("")}>
            &times;
          </button>
          {mensajeConfirmacion}
        </div>
      )}
    </div>
  );
}

export default PatientArrival;
