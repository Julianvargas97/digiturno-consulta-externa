import React, { useState, useCallback, useEffect, useRef } from "react";
import { FaPhoneAlt, FaTrashAlt } from "react-icons/fa";
import {
  FaHeartbeat,
  FaStethoscope,
  FaFlask,
  FaSyringe,
  FaRobot,
  FaUserNurse,
  FaMicroscope,
  FaUserMd,
  FaBandAid,
  FaCalendarCheck,
  FaNotesMedical,
  FaCapsules,
  FaHospitalUser,
  FaMoneyBillWave,
  FaQrcode,
  FaCarCrash,
  FaHandsHelping,
} from "react-icons/fa";
import { MdOutlineVaccines } from "react-icons/md";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useMultiSocket from "./useMultiSocket";
import "./Facturacion.css";
import { API_BASE_URL } from "./PatientArrival";
import Swal from "sweetalert2";

const allSpe = [
  "ATENCION_GENERAL",
  "SOAT",
  "ARL",
  "FACTURACION_DIGITAL",
  "POSTQUIRURGICOS",
  "MEDICINA_PREPAGADA",
  "PREPARACIONES_MAGISTRALES",
  "INFUSIONES",
  "RECAUDOS",
  "QR",
  "CURACIONES",
  "LABORATORIOS",
  "ATENCION_PREFERENCIAL",
  "ONCOLOGIA",
];

const MODULOS = [
  { moduleName: "MODULO_0", availableSpecialities: ["CIRUGIA_PROGRAMADA"] },
  { moduleName: "MODULO_1", availableSpecialities: ["SOAT", "ARL"] },
  {
    moduleName: "MODULO_2",
    availableSpecialities: allSpe,
  },
  {
    moduleName: "MODULO_3",
    availableSpecialities: allSpe,
  },
  { moduleName: "MODULO_4", availableSpecialities: allSpe },
  {
    moduleName: "MODULO_5",
    availableSpecialities: allSpe,
  },
  {
    moduleName: "MODULO_6",
    availableSpecialities: allSpe,
  },
  {
    moduleName: "MODULO_7",
    availableSpecialities: allSpe,
  },
  {
    moduleName: "MODULO_8",
    availableSpecialities: allSpe,
  },
  {
    moduleName: "MODULO_9",
    availableSpecialities: allSpe,
  },
  {
    moduleName: "MODULO_10",
    availableSpecialities: allSpe,
  },
  {
    moduleName: "MODULO_11",
    availableSpecialities: allSpe,
  },
  {
    moduleName: "MODULO_12",
    availableSpecialities: allSpe,
  },
];

const formatearModuloNombre = (nombre) => {
  const partes = nombre.split("_");
  return `Módulo ${partes[1]}`;
};

const formatearEspecialidad = (texto) => {
  const palabras = texto
    .split("_")
    .map(
      (palabra) =>
        palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
    );
  return palabras
    .join(" ")
    .replace("Soat", "SOAT")
    .replace("Ips", "IPS")
    .replace("Eps", "EPS")
    .replace("Qr", "QR")
    .replace("Arl", "ARL")
    .replace("Cirugia", "Cirugía")
    .replace("Preparaciones", "Preparaciones")
    .replace("Postquirurgicos", "Postquirúrgicos")
    .replace("Facturacion", "Facturación")
    .replace("Atencion", "Atención");
};

const especialidadColores = {
  SOAT: "#E91E63",
  ARL: "#3F51B5",
  ATENCION_GENERAL: "#009688",
  CURACIONES: "#FF5722",
  CIRUGIA_PROGRAMADA: "#673AB7",
  MEDICINA_PREPAGADA: "#FF9800",
  PREPARACIONES_MAGISTRALES: "#795548",
  INFUSIONES: "#607D8B",
  RECAUDOS: "#9E9E9E",
  QR: "#00BCD4",
  LABORATORIOS: "#4CAF50",
  ATENCION_PREFERENCIAL: "#F44336",
  ONCOLOGIA: "#8BC34A",
  FACTURACION_DIGITAL: "#3A9AD9",
  POSTQUIRURGICOS: "#CDDC39",
};

const especialidadIconos = {
  SOAT: <FaCarCrash />,
  ARL: <FaUserNurse />,
  ATENCION_GENERAL: <FaStethoscope />,
  CURACIONES: <FaBandAid />,
  CIRUGIA_PROGRAMADA: <FaUserMd />,
  MEDICINA_PREPAGADA: <FaNotesMedical />,
  PREPARACIONES_MAGISTRALES: <FaFlask />,
  INFUSIONES: <FaSyringe />,
  RECAUDOS: <FaMoneyBillWave />,
  QR: <FaQrcode />,
  LABORATORIOS: <FaMicroscope />,
  ATENCION_PREFERENCIAL: <FaHospitalUser />,
  ONCOLOGIA: <FaHeartbeat />,
  FACTURACION_DIGITAL: <FaNotesMedical />,
  POSTQUIRURGICOS: <FaCalendarCheck />,
};

function obtenerColorEspecialidad(especialidad) {
  return especialidadColores[especialidad] || "#607D8B";
}

function Facturacion() {
  const [moduloSeleccionado, setModuloSeleccionado] = useState(null);
  const [turnos, setTurnos] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [nuevosTurnos, setNuevosTurnos] = useState([]);
  const [opcionesConsultorios, setOpcionesConsultorios] = useState([]);
  const notifiedTurnosRef = useRef(new Set());
  const toastIdRef = useRef(null);
  const nuevosAcumuladosRef = useRef([]);

  //ACTUALIZACION DE VISTA CADA 2 SEGUNDOS

  useEffect(() => {
    if (!moduloSeleccionado) return;

    const cargarTurnosContinuamente = async () => {
      try {
        const url = `${API_BASE_URL}/appointments`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Error al cargar turnos");
        const data = await res.json();
        if (!Array.isArray(data)) return;

        setTurnos(data);
      } catch (error) {
        console.error("Error al recargar turnos automáticamente:", error);
      }
    };

    const intervalId = setInterval(cargarTurnosContinuamente, 2000);
    cargarTurnosContinuamente();

    return () => clearInterval(intervalId);
  }, [moduloSeleccionado]);

  // Manejo mensajes socket

  const onMessages = useCallback(
    (allMessages) => {
      const modulo = moduloSeleccionado?.moduleName?.trim().toLowerCase();
      if (!modulo) return;

      let mensajes = [];
      if (Array.isArray(allMessages)) {
        mensajes = allMessages.flat(Infinity);
      }

      mensajes.forEach((msg) => {
        const parsed = typeof msg === "string" ? JSON.parse(msg) : msg;

        if (parsed.type === "deleteAppointment" && parsed.appointmentId) {
          // Eliminar turno si existe en el estado local
          setTurnos((prevTurnos) =>
            prevTurnos.filter((t) => t.id !== parsed.appointmentId)
          );
          setNuevosTurnos((prev) =>
            prev.filter((id) => id !== parsed.appointmentId)
          );
        }

        if (
          parsed &&
          parsed.id &&
          parsed.attentionModule &&
          parsed.attentionModule.trim().toLowerCase() === modulo
        ) {
          setTurnos((prevTurnos) => {
            if (!prevTurnos.some((t) => t.id === parsed.id)) {
              return [...prevTurnos, parsed];
            }
            return prevTurnos;
          });
        }
      });
    },
    [moduloSeleccionado?.moduleName]
  );

  const { sendMessage, MultiSocketComponents } = useMultiSocket(
    moduloSeleccionado?.availableSpecialities || [],
    onMessages
  );

  // Manejo de notificaciones agrupadas

  // Manejo de notificaciones agrupadas
  useEffect(() => {
    if (turnos.length === 0) return;

    // Filtrar turnos que aún no se han notificado
    const nuevos = turnos.filter((t) => !notifiedTurnosRef.current.has(t.id));
    if (nuevos.length === 0) return;

    // Marcar como notificados
    nuevos.forEach((t) => notifiedTurnosRef.current.add(t.id));

    // Acumular nuevos turnos para notificación agrupada
    nuevosAcumuladosRef.current.push(...nuevos);

    // Cerrar toast anterior si existe
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current);
    }

    // Mostrar toast agrupado con todos los turnos acumulados
    const totalNuevos = nuevosAcumuladosRef.current.length;
    const mensaje =
      totalNuevos === 1
        ? `Nuevo turno: ${
            nuevosAcumuladosRef.current[0].patientName || "Paciente"
          }`
        : `${totalNuevos} nuevos turnos recibidos`;

    toastIdRef.current = toast.info(mensaje, {
      autoClose: 3000,
      onClose: () => {
        // Limpiar acumulado cuando se cierra el toast
        nuevosAcumuladosRef.current = [];
      },
    });

    // Opcional: actualizar estado para marcar visualmente
    setNuevosTurnos((prev) => [...prev, ...nuevos.map((t) => t.id)]);
  }, [turnos]);

  const enviarLlamada = async (appointment) => {
    if (!moduloSeleccionado) {
      toast.error("Debe seleccionar un módulo primero");
      return;
    }
    try {
      const data = JSON.stringify({
        appointmentId: appointment.id,
        moduleName: moduloSeleccionado.moduleName.replace(/\D/g, ""),
      });

      console.log(data);
      const response = await fetch(`${API_BASE_URL}/announce-to-billing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: data,
      });
      if (!response.ok) throw new Error("Error al enviar la llamada");
      toast.success(
        `Llamando a ${appointment.patientName || "Paciente"} - Turno: ${
          appointment.turn
        }`
      );
    } catch (err) {
      console.error("[ERROR]", err);
      toast.error("No se pudo enviar la llamada.");
    }
  };

  const manejarEliminar = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este turno?")) return;
    try {
      const response = await fetch(
        `${API_BASE_URL}/unattend-patient/${id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" }
        }
      );
      if (!response.ok) throw new Error("Error al eliminar la cita");

      setTurnos((prev) => prev.filter((turno) => turno.id !== id));
      setNuevosTurnos((prev) => prev.filter((turnoId) => turnoId !== id));
      toast.success("Turno eliminado correctamente");

      sendMessage({
        type: "deleteAppointment",
        appointmentId: id,
      });
    } catch (error) {
      console.error("Error al eliminar turno:", error);
      toast.error("No se pudo eliminar el turno. Intenta nuevamente.");
    }
  };

  //ENVIAR A RECEPCIÓN

  const enviarRecepcion = async (turnoId, officeName) => {
    if (!officeName) {
      toast.error("Seleccione un consultorio antes de enviar");
      return;
    }

    const appointment = turnos.find((t) => t.id === turnoId);
    if (!appointment) {
      toast.error("No se encontró el turno seleccionado");
      return;
    }

    const sendData = {
      appointmentId: appointment.id,
      moduleName: officeName.split("_")[1] || officeName,
    };

    console.log("Enviando a recepción:", sendData);

    try {
      await fetch(`${API_BASE_URL}/end-attention-module`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sendData),
      });

      // const data = await response.json();
      // if (!response.ok) throw new Error("Error al enviar a recepción");

      // toast.success(
      //   `Paciente enviado a recepción: ${data.reception || officeName}`
      // );

      //SE REMUEVE EL TURNO DEL ESTADO PARA QUE DESAPAREZCA

      setTurnos((prev) => prev.filter((t) => t.id !== turnoId));
      setNuevosTurnos((prev) => prev.filter((id) => id !== turnoId));
    } catch (error) {
      console.error("Error al enviar a recepción:", error);
      toast.error("No se pudo enviar a recepción. Intenta nuevamente.");
    }
  };

  const mostrarSwalConsultorios = async (turnoId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/offices`);
      const data = await response.json();
      const consultorios = Array.isArray(data) ? data : data.offices || [];

      const options = {};
      consultorios.forEach((c) => {
        options[c.officeName] = c.officeName;
      });

      const result = await Swal.fire({
        title: "Asignar Consultorio",
        input: "select",
        inputOptions: options,
        inputPlaceholder: "Seleccione un consultorio",
        showCancelButton: true,
        confirmButtonText: "Asignar",
        cancelButtonText: "Cancelar",
        icon: "question",
      });

      if (result.isConfirmed && result.value) {
        await enviarRecepcion(turnoId, result.value);
      }
    } catch (err) {
      console.error("Error al cargar consultorios para Swal:", err);
      toast.error("No se pudieron cargar los consultorios.");
    }
  };

  const turnosFiltrados = turnos
    .filter((turno) => {
      const filtroLower = filtro.toLowerCase();

      const especialidadOk = moduloSeleccionado?.availableSpecialities.includes(
        turno.speciality
      );

      const busca =
        turno.patientName?.toLowerCase().includes(filtroLower) ||
        turno.nombre?.toLowerCase().includes(filtroLower) ||
        turno.patientId?.toLowerCase().includes(filtroLower) ||
        formatearEspecialidad(turno.speciality)
          ?.toLowerCase()
          .includes(filtroLower);

      return especialidadOk && busca;
    })
    .sort((a, b) => {
      if (
        a.speciality === "ATENCION_PREFERENCIAL" &&
        b.speciality !== "ATENCION_PREFERENCIAL"
      )
        return -1;
      if (
        b.speciality === "ATENCION_PREFERENCIAL" &&
        a.speciality !== "ATENCION_PREFERENCIAL"
      )
        return 1;
      return 0;
    });

  if (!moduloSeleccionado) {
    return (
      <div className="facturacion-container" style={{ textAlign: "center" }}>
        <h1>Seleccione su Módulo</h1>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            maxWidth: 400,
            margin: "30px auto",
          }}
        >
          {MODULOS.map((mod) => (
            <li key={mod.moduleName} style={{ marginBottom: 15 }}>
              <button
                className="btn-llamar"
                style={{ width: "100%", fontSize: "1.1rem" }}
                onClick={() => {
                  setModuloSeleccionado(mod);
                  setTurnos([]);
                  setFiltro("");
                  setNuevosTurnos([]);
                }}
              >
                {formatearModuloNombre(mod.moduleName)}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="facturacion-container">
      <ToastContainer autoClose={3000} />
      <div className="facturacion-header">
        <h1>
          Gestión de turnos -{" "}
          {formatearModuloNombre(moduloSeleccionado.moduleName)}
        </h1>
        <div className="especialidades-contenedor">
          <strong>Especialidades que atiende este módulo:</strong>
          <div className="especialidades-lista">
            {moduloSeleccionado.availableSpecialities.map((especialidad) => (
              <span
                key={especialidad}
                className="especialidad-item"
                style={{
                  backgroundColor: obtenerColorEspecialidad(especialidad),
                  color: "white",
                  padding: "5px 10px",
                  borderRadius: "8px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                {especialidadIconos[especialidad] || null}{" "}
                {formatearEspecialidad(especialidad)}
              </span>
            ))}
          </div>
        </div>

        <button
          onClick={() => {
            setModuloSeleccionado(null);
            setTurnos([]);
            setFiltro("");
            setNuevosTurnos([]);
          }}
          className="btn-eliminar"
          style={{ height: 40, alignSelf: "center" }}
          title="Cambiar módulo"
        >
          Cambiar módulo
        </button>
      </div>

      <input
        type="text"
        placeholder="Filtrar por nombre, cédula o especialidad..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="select-turno"
      />

      <table className="tabla-turnos">
        <thead>
          <tr>
            <th>Turno</th>
            <th>Nombre Completo</th>
            <th>Número de Documento</th>
            <th>Especialidad</th>
            <th style={{ textAlign: "center" }}>Hora Confirmación</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {turnosFiltrados.length === 0 ? (
            <tr>
              <td colSpan="7" className="sin-turnos">
                {turnos.length === 0
                  ? "No hay turnos confirmados aún."
                  : "No hay coincidencias con el filtro."}
              </td>
            </tr>
          ) : (
            turnosFiltrados.map((turno) => (
              <tr
                key={turno.id}
                className={`${
                  nuevosTurnos.includes(turno.id) ? "turno-nuevo" : ""
                } ${
                  turno.speciality === "ATENCION_PREFERENCIAL"
                    ? "turno-preferencial"
                    : ""
                }`}
                style={
                  turno.speciality === "ATENCION_PREFERENCIAL"
                    ? {
                        backgroundColor: "rgba(220, 53, 69, 0.3)",
                        color: "white",
                        fontWeight: "bold",
                      }
                    : {}
                }
              >
                <td>{turno.turn || "-"}</td>
                <td>{turno.patientName || turno.nombre || "-"}</td>
                <td>{turno.patientId || "-"}</td>
                <td>
                  {especialidadIconos[turno.speciality] || null}{" "}
                  {formatearEspecialidad(turno.speciality) || "-"}
                </td>
                <td style={{ textAlign: "center" }}>
                  {turno.arrivalTime ? turno.arrivalTime.slice(0, 5) : "-"}
                </td>
                <td>
                  <button
                    className="btn-eliminar"
                    onClick={() => manejarEliminar(turno.id)}
                    title="No asistió"
                  >
                    <FaTrashAlt />
                    No asistió
                  </button>

                  <button
                    className="btn-llamar"
                    onClick={() => enviarLlamada(turno)}
                    title="Llamar paciente"
                  >
                    <FaPhoneAlt />
                  </button>
                  <button
                    className="btn-tamizaje"
                    onClick={() => {
                      console.log("Enviando a tamizaje:", turno);
                      enviarRecepcion(turno.id, moduloSeleccionado.moduleName);
                    }}
                    title="Enviar a tamizaje"
                  >
                    <MdOutlineVaccines />
                    Tamizaje
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {MultiSocketComponents}
    </div>
  );
}

export default Facturacion;
