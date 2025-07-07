import React, { useEffect, useState } from "react";
import useSocket, { DestSocket } from "./useSocket";
import "./PatientArrival.css";

import OpenAI from "openai";
const client = new OpenAI({
  apiKey:
    "",
  dangerouslyAllowBrowser: true,
});

export const API_BASE_URL = "http://localhost:5000/api/external-consultation";

function PatientArrival() {
  const [paciente, setPaciente] = useState({
    nombre: "",
    cedula: "",
    especialidad: "",
  });

  const [especialidades, setEspecialidades] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [mensajeConfirmacion, setMensajeConfirmacion] = useState("");
  const [loading, setLoading] = useState(false);

  // WebSocket
  useSocket(
    DestSocket[`ExternalConsultationArrival_${paciente.especialidad}`] ||
      DestSocket.ARRIVAL
  );

  // Cargar especialidades y módulos al inicio
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [espRes, modRes] = await Promise.all([
          fetch(`${API_BASE_URL}/specialities`),
          fetch(`${API_BASE_URL}/available-modules`),
        ]);

        if (!espRes.ok || !modRes.ok) throw new Error("Error al cargar datos");

        const [espData, modData] = await Promise.all([
          espRes.json(),
          modRes.json(),
        ]);

        setEspecialidades(espData);
        setModulos(modData);
      } catch (error) {
        console.error("Carga inicial fallida:", error);
        setMensajeConfirmacion("No se pudieron cargar datos iniciales.");
      }
    };

    cargarDatos();
  }, []);

  const obtenerModuloAsignado = () =>
    modulos.find((mod) =>
      mod.availableSpecialities.includes(paciente.especialidad)
    );

  const limpiarCampo = (campo) => {
    setPaciente((prev) => ({ ...prev, [campo]: "" }));
    setMensajeConfirmacion("");
  };

  const confirmarLlegada = async () => {
    const { nombre, cedula, especialidad } = paciente;

    if (!nombre.trim() || !cedula.trim() || !especialidad) {
      return alert("Por favor completa todos los campos");
    }

    const moduloAsignado = obtenerModuloAsignado();
    if (!moduloAsignado) {
      return alert("No se encontró un módulo para esta especialidad.");
    }

    const payload = {
      id: parseInt(cedula.trim(), 10),
      speciality: especialidad,
      arrivalTime: new Date().toISOString(),
      attentionTime: null,
      endAttentionTime: null,
      patientName: nombre.trim(),
      patientId: cedula.trim(),
      turn: null,
      attentionModule: moduloAsignado?.moduleName || null,
      state: "WAITING",
      receptionName: null,
    };

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/arrival`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let msg = "Error al confirmar llegada";
        try {
          const errorData = await res.json();
          msg = errorData.message || msg;
        } catch {}
        throw new Error(msg);
      }

      const result = await res.json();
      setMensajeConfirmacion(
        `✅ Llegada confirmada para ${result.patientName}. Su turno asignado es: ${result.turn}`
      );

      setPaciente({ nombre: "", cedula: "", especialidad: "" });
    } catch (err) {
      console.error("Confirmación fallida:", err);
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Temporizador para ocultar mensaje de confirmación
  useEffect(() => {
    if (!mensajeConfirmacion) return;
    const timer = setTimeout(() => setMensajeConfirmacion(""), 5000);
    return () => clearTimeout(timer);
  }, [mensajeConfirmacion]);

  const [debounceValue, setDebounceValue] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebounceValue(paciente.nombre);
    }, 1000);

    return () => clearTimeout(handler);
  }, [paciente.nombre]);

  // const formatName = async (name) => {
  //   const prompt = `
  //     Extract and format the following Spanish name that appears as a continuous string in all caps. The format typically follows: [LASTNAME1][LASTNAME2][FIRSTNAME][MIDDLENAME]. 

  //     Return only the properly formatted name as: [FIRSTNAME] [MIDDLENAME] [LASTNAME1] [LASTNAME2]

  //     Use proper capitalization (first letter uppercase, rest lowercase) and appropriate spacing.

  //     Input: ${name}
  //     Output:`;
  //   const response = await client.responses.create({
  //     model: "gpt-3.5-turbo",
  //     input: prompt,
  //   });
  //   return response.output_text;
  // };

  // const verifyQRReader = (value) => {
  //   if (typeof value !== "string") {
  //     console.warn("QR value is not a string:", value);
  //     return;
  //   }

  //   const hasQuestionMark = value.includes("?");
  //   const hasGenderCode = /0[MmFf]/.test(value);

  //   if (hasQuestionMark && hasGenderCode) {
  //     const parts = value.split("?");
  //     if (parts.length > 1) {
  //       const data = parts[1].split(/0[MmFf]/)[0];

  //       const match = data.match(/[A-Za-z]/); // Busca la primera letra
  //       if (match) {
  //         const index = match.index;
  //         const parteNumerica = data.substring(0, index);
  //         const parteTexto = data.substring(index);
  //         const cedula = parteNumerica.slice(9);

  //         formatName(parteTexto).then((nombre) => {
  //           setPaciente((prev) => ({
  //             ...prev,
  //             nombre: nombre.trim(),
  //             cedula: cedula,
  //           }));
  //         });
  //       }
  //     }
  //   }
  // };

  // useEffect(() => {
  //   verifyQRReader(debounceValue);
  // }, [debounceValue]);


  return (
    <div className="recepcion-container">
      <h1>Confirmar llegada paciente</h1>

      <div className="formulario">
        {/* Nombre */}
        <label>Nombre completo:</label>
        <div className="input-container">
          <input
            type="text"
            placeholder="Nombre completo"
            value={paciente.nombre}
            onChange={(e) =>
              setPaciente({ ...paciente, nombre: e.target.value })
            }
            disabled={loading}
          />
          {paciente.nombre && !loading && (
            <button
              className="borrar-btn"
              onClick={() => limpiarCampo("nombre")}
            >
              &times;
            </button>
          )}
        </div>

        {/* Cédula */}
        <label>Cédula:</label>
        <div className="input-container">
          <input
            type="text"
            placeholder="Número de cédula"
            value={paciente.cedula}
            onChange={(e) =>
              setPaciente({ ...paciente, cedula: e.target.value })
            }
            disabled={loading}
          />
          {paciente.cedula && !loading && (
            <button
              className="borrar-btn"
              onClick={() => limpiarCampo("cedula")}
            >
              &times;
            </button>
          )}
        </div>

        {/* Especialidad */}
        <label>Especialidad:</label>
        <div className="input-container">
          <select
            value={paciente.especialidad}
            onChange={(e) =>
              setPaciente({ ...paciente, especialidad: e.target.value })
            }
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
            <button
              className="borrar-btn"
              onClick={() => limpiarCampo("especialidad")}
            >
              &times;
            </button>
          )}
        </div>

        {/* Confirmar */}
        <button
          className="confirmar-btn"
          onClick={confirmarLlegada}
          disabled={loading}
          style={{ position: "relative" }}
        >
          {loading ? <div className="spinner" /> : "Confirmar llegada"}
        </button>
      </div>

      {/* Mensaje de confirmación */}
      {mensajeConfirmacion && (
        <div className="mensaje-confirmacion">
          <button
            className="cerrar-mensaje"
            onClick={() => setMensajeConfirmacion("")}
          >
            &times;
          </button>
          {mensajeConfirmacion}
        </div>
      )}
    </div>
  );
}

export default PatientArrival;
