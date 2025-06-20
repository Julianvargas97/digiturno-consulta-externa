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
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useMultiSocket from "./useMultiSocket";
import "./Facturacion.css";
import { API_BASE_URL } from "./PatientArrival";
import Swal from "sweetalert2";


const MODULOS = [
  { moduleName: "MODULO_0", availableSpecialities: ["CIRUGIA_PROGRAMADA"] },
  { moduleName: "MODULO_1", availableSpecialities: ["SOAT", "ARL"] },
  { moduleName: "MODULO_2", availableSpecialities: ["ATENCION_GENERAL", "SOAT", "ARL"] },
  { moduleName: "MODULO_3", availableSpecialities: ["FACTURACION_DIGITAL", "POSTQUIRURGICOS", "ATENCION_GENERAL"] },
  { moduleName: "MODULO_4", availableSpecialities: ["ATENCION_GENERAL"] },
  { moduleName: "MODULO_5", availableSpecialities: ["MEDICINA_PREPAGADA", "PREPARACIONES_MAGISTRALES", "INFUSIONES", "RECAUDOS", "QR"] },
  { moduleName: "MODULO_6", availableSpecialities: ["ATENCION_GENERAL", "CURACIONES"] },
  { moduleName: "MODULO_7", availableSpecialities: ["LABORATORIOS", "ATENCION_PREFERENCIAL"] },
  { moduleName: "MODULO_8", availableSpecialities: ["ATENCION_PREFERENCIAL", "ONCOLOGIA"] },
  { moduleName: "MODULO_9", availableSpecialities: ["ATENCION_PREFERENCIAL", "ATENCION_GENERAL"] },
  { moduleName: "MODULO_10", availableSpecialities: ["ATENCION_PREFERENCIAL", "ATENCION_GENERAL"] },
  { moduleName: "MODULO_11", availableSpecialities: ["ATENCION_PREFERENCIAL", "ATENCION_GENERAL"] },
  { moduleName: "MODULO_12", availableSpecialities: ["ATENCION_PREFERENCIAL", "ATENCION_GENERAL"] },
];


const formatearModuloNombre = (nombre) => {
  const partes = nombre.split("_");
  return `Módulo ${partes[1]}`;
};






const formatearEspecialidad = (texto) => {
  const palabras = texto.split('_').map(palabra =>
    palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
  );
  return palabras
    .join(' ')
    .replace('Soat', 'SOAT')
    .replace('Ips', 'IPS')
    .replace('Eps', 'EPS')
    .replace('Qr', 'QR')
    .replace('Arl', 'ARL')
    .replace('Cirugia', 'Cirugía')
    .replace('Preparaciones', 'Preparaciones')
    .replace('Postquirurgicos', 'Postquirúrgicos')
    .replace('Facturacion', 'Facturación')
    .replace('Atencion', 'Atención');
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

 
 
  useEffect(() => {
  if (!moduloSeleccionado) return;

  async function cargarTurnosIniciales() {
    try {
      console.log(moduloSeleccionado)
      const url = `${API_BASE_URL}/module/${encodeURIComponent(moduloSeleccionado.moduleName)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error al cargar turnos");
      const data = await res.json();
      console.log("Respuesta de la API:", data)
      if (data && Array.isArray(data.currentAppointments)) {
      setTurnos(data.currentAppointments);
      } else {
     setTurnos([]);
      toast.error("No se encontraron citas actuales para este módulo.");
    }

      setNuevosTurnos([]);
    } catch (error) {
      console.error(error);
      toast.error("No se pudieron cargar los turnos al iniciar.");
    }
  }

  cargarTurnosIniciales();
}, [moduloSeleccionado]);






  const onMessages = useCallback((allMessages) => {
    if (!moduloSeleccionado) return;

    let mensajes = [];
    if (Array.isArray(allMessages)) {
      mensajes = allMessages.flat(Infinity);
    }

    mensajes
      .filter((msg) =>
        msg &&
        msg.attentionModule &&
        msg.attentionModule.trim().toLowerCase() === moduloSeleccionado.moduleName.trim().toLowerCase()
      )
      .forEach((msg) => {
        try {
          const parsed = typeof msg === "string" ? JSON.parse(msg) : msg;
          if (parsed && parsed.id) {
            setTurnos((prevTurnos) => {
              if (!prevTurnos.some((t) => t.id === parsed.id)) {
                return [...prevTurnos, parsed];
              }
              return prevTurnos;
            });
          }
        } catch (err) {
          console.error("Error procesando mensaje:", err);
        }
      });
  }, [moduloSeleccionado]);

  const { sendMessage, MultiSocketComponents } = useMultiSocket(
    moduloSeleccionado?.availableSpecialities || [],
    onMessages
  );

   useEffect(() => {
    if (turnos.length === 0) return;

    setNuevosTurnos((prevNuevos) => {
      const nuevosIds = [];

      turnos.forEach((t) => {
        if (!notifiedTurnosRef.current.has(t.id)) {
          toast.info(`Nuevo turno: ${t.patientName || t.nombre || "Paciente"}`);
          notifiedTurnosRef.current.add(t.id);  // <-- Guardamos que ya notificamos este turno
          nuevosIds.push(t.id);
        }
      });

      if (nuevosIds.length === 0) return prevNuevos;
      return [...prevNuevos, ...nuevosIds];
    });
  }, [turnos]);

  const enviarLlamada = async (appointment) => {
    if (!moduloSeleccionado) {
      toast.error("Debe seleccionar un módulo primero");
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/announce-to-billing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...appointment,
          attentionModule: moduloSeleccionado.moduleName.replace(/\D/g, ""),
        }),
      });
      if (!response.ok) throw new Error("Error al enviar la llamada");
      toast.success(`Llamando a ${appointment.patientName || "Paciente"} - Turno: ${appointment.turn}`);
    } catch (err) {
      console.error("[ERROR]", err);
      toast.error("No se pudo enviar la llamada.");
    }
  };

  const manejarEliminar = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este turno?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/delete-appoinment/modules/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Error al eliminar la cita");

      setTurnos((prev) => prev.filter((turno) => turno.id !== id));
      setNuevosTurnos((prev) => prev.filter((turnoId) => turnoId !== id));
      toast.success("Turno eliminado correctamente");
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

    const appointment = turnos.find(t => t.id === turnoId);
    if (!appointment) {
      toast.error("No se encontró el turno seleccionado");
      return;
    }



    try {
      const response = await fetch(`${API_BASE_URL}/send-to-waiting-reception/${officeName}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointment),
      });

      const data = await response.json();
      if (!response.ok) throw new Error("Error al enviar a recepción");

      toast.success(`Paciente enviado a recepción: ${data.reception || officeName}`);

      sendMessage({
        type: "assignConsultorio",
        appointment: appointment,
        consultorio: officeName,
      });


      //SE REMUEVE EL TURNO DEL ESTADO PARA QUE DESAPAREZCA  

      setTurnos(prev => prev.filter(t => t.id !== turnoId));
    setNuevosTurnos(prev => prev.filter(id => id !== turnoId));


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

  const turnosFiltrados = turnos.filter((turno) => {
    const filtroLower = filtro.toLowerCase();
    return (
      (turno.patientName && turno.patientName.toLowerCase().includes(filtroLower)) ||
      (turno.nombre && turno.nombre.toLowerCase().includes(filtroLower)) ||
      (turno.patientId && turno.patientId.toLowerCase().includes(filtroLower)) ||
      (turno.speciality && turno.speciality.toLowerCase().includes(filtroLower))
    );
  });

  if (!moduloSeleccionado) {
    return (
      <div className="facturacion-container" style={{ textAlign: "center" }}>
        <h1>Seleccione su Módulo</h1>
        <ul style={{ listStyle: "none", padding: 0, maxWidth: 400, margin: "30px auto" }}>




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
      <ToastContainer />
      <div className="facturacion-header">
        <h1>Gestión de turnos - {formatearModuloNombre(moduloSeleccionado.moduleName)}</h1>
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
        {especialidadIconos[especialidad] || null} {formatearEspecialidad (especialidad)}
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
                {turnos.length === 0 ? "No hay turnos confirmados aún." : "No hay coincidencias con el filtro."}
              </td>
            </tr>
          ) : (
            turnosFiltrados
              .filter((p) => p.attentionModule && p.attentionModule.trim().toLowerCase() === moduloSeleccionado.moduleName.trim().toLowerCase())
              .map((turno) => (
                <tr
                  key={turno.id}
                  className={nuevosTurnos.includes(turno.id) ? "turno-nuevo" : ""}
                >
                  <td>{turno.turn || "-"}</td>
                  <td>{turno.patientName || turno.nombre || "-"}</td>
                  <td>{turno.patientId || "-"}</td>
                  <td>{turno.speciality || "-"}</td>
                  <td style={{ textAlign: "center" }}>
                   {turno.arrivalTime ? turno.arrivalTime.slice(0, 5) : "-"}
                  </td> 
                  <td>
                    <button className="btn-llamar" onClick={() => enviarLlamada(turno)} title="Llamar paciente">
                      <FaPhoneAlt />
                    </button>
                    <button className="btn-eliminar" onClick={() => manejarEliminar(turno.id)} title="Eliminar turno">
                      <FaTrashAlt />
                    </button>



                     {/* <button className="btn-enviar" onClick={() => mostrarSwalConsultorios(turno.id)} title="Enviar a recepción">
                      Enviar
                      </button> */}




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
