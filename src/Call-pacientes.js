import React, { useState, useEffect } from "react";
import fondo from "./HUSJ.jpeg";
import logo from "./logo.png";
import Telemedicina from "./Telemedicina.png";
import logo3 from "./logo3.png";
import Facturacion from "./Facturacion.jpeg";
import sonidoTurno from "./sonido.mp3";
import "./Call-pacientes.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPhone } from "@fortawesome/free-solid-svg-icons";
import { faWhatsapp } from "@fortawesome/free-brands-svg-icons";
import useSocket, { DestSocket } from "./useSocket";

const frases = [
  {
    logo: logo,
    titulo: "¡En alianza por una atención digna e integral!",
    subtitulo: "Es un gusto tenerte aquí.",
    estiloLogo: { maxHeight: "130px", marginTop: "40px" },
    estiloTexto: { fontSize: "1.2rem", marginTop: "10px" },
  },
  {
    logo: Telemedicina,
    titulo: "Pregunta por Telesalud para particulares.",
    subtitulo: (
      <div style={{ textAlign: "center", lineHeight: "1.6" }}>
        Puedes comunicarte, estamos listos para ayudarte<br />
        <FontAwesomeIcon icon={faWhatsapp} style={{ color: "#25D366", marginRight: "8px", verticalAlign: "middle", fontSize: "1.2rem" }} />
        <a href="https://wa.me/573168331579" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "#1B5E20", fontWeight: "bold" }}>
          316-833-1579
        </a>
      </div>
    ),
    estiloLogo: { maxHeight: "200px", marginTop: "30px" },
  },
  {
    logo: Telemedicina,
    titulo: "Telesalud es una alternativa práctica y económica",
    subtitulo: (
      <div style={{ textAlign: "center", lineHeight: "1.6" }}>
        Telemedicina, ¡La salud al alcance de todos!<br />
        <FontAwesomeIcon icon={faWhatsapp} style={{ color: "#247040", marginRight: "8px", verticalAlign: "middle", fontSize: "1.2rem" }} />
        <a href="https://wa.me/573168331579" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "#1B5E20", fontWeight: "bold" }}>
          316-833-1579
        </a>
      </div>
    ),
    estiloLogo: { maxHeight: "400px", maxWidth: "90%", marginTop: "30px" },
    estiloTexto: { fontSize: "1rem", marginTop: "10px" },
  },
  {
    logo: Facturacion,
    titulo: "",
    subtitulo: "",
    estiloLogo: { maxHeight: "720px", maxWidth: "auto", marginTop: "0px" },
  }
];

function CallPacientes() {
  const [turnos, setTurnos] = useState([]);
  const [horaActual, setHoraActual] = useState(new Date());
  const [resaltar, setResaltar] = useState(false);
  const [indiceFrase, setIndiceFrase] = useState(0);
  const [mostrarLogo, setMostrarLogo] = useState(true);
  const { data } = useSocket(DestSocket.ExternalConsultationArrival_ANOUNCETOBILLING);

  useEffect(() => {
    const reloj = setInterval(() => setHoraActual(new Date()), 1000);
    return () => clearInterval(reloj);
  }, []);

  useEffect(() => {
    const limpiarTurnos = setInterval(() => {
      const ahora = Date.now();
      setTurnos((prev) => {
        let filtrados = prev.filter((t) => ahora - t.timestamp < 5 * 60 * 1000);
        if (filtrados.length > 10) {
          filtrados.sort((a, b) => a.timestamp - b.timestamp);
          filtrados = filtrados.slice(-10);
        }
        return filtrados;
      });
    }, 60000);
    return () => clearInterval(limpiarTurnos);
  }, []);

  useEffect(() => {
    if (data && data.turn && data.attentionModule) {
      const nuevoTurno = {
        turno: data.turn,
        modulo: data.attentionModule,
        timestamp: Date.now(),
        patientName: data.patientName || "",
      };

      const reproducirSonidoYHablar = () => {
        const audio1 = new Audio(sonidoTurno);
        audio1.volume = 1.0;
        audio1.play().then(() => {
          setTimeout(() => {
            const audio2 = new Audio(sonidoTurno);
            audio2.volume = 1.0;
            audio2.play().then(() => {
              setTimeout(() => {
                const mensaje = `${data.patientName} con Turno ${data.turn}, por favor dirigirse al ${data.attentionModule}`;
                const utterance = new SpeechSynthesisUtterance(mensaje);
                const voces = speechSynthesis.getVoices();
                const vozColombiana = voces.find((v) => v.lang === "es-CO");
                utterance.voice = vozColombiana || voces.find(v => v.lang.startsWith("es")) || null;
                utterance.rate = 1;
                utterance.pitch = 1;
                speechSynthesis.speak(utterance);
              }, 500);
            });
          }, 2900);
        });
      };

      reproducirSonidoYHablar();

      setResaltar(true);
      setTimeout(() => setResaltar(false), 6000);

      setTurnos((prev) => {
        const sinAnterior = prev.filter(
          (t) => !(t.turno === nuevoTurno.turno && t.modulo === nuevoTurno.modulo)
        );
        return [nuevoTurno, ...sinAnterior];
      });
    }
  }, [data]);

  useEffect(() => {
    const rotar = setInterval(() => {
      if (turnos.length > 1) {
        setTurnos((prev) => {
          const nuevos = [...prev];
          const primero = nuevos.shift();
          nuevos.push(primero);
          return nuevos;
        });
        setResaltar(true);
        setTimeout(() => setResaltar(false), 6000);
      }
    }, 15000);
    return () => clearInterval(rotar);
  }, [turnos]);

  useEffect(() => {
    const cambiarFrase = setInterval(() => {
      setIndiceFrase((prev) => (prev + 1) % frases.length);
    }, 8000);
    return () => clearInterval(cambiarFrase);
  }, []);

  useEffect(() => {
    setMostrarLogo(false);
    const timeoutId = setTimeout(() => setMostrarLogo(true), 300);
    return () => clearTimeout(timeoutId);
  }, [indiceFrase]);

  const formatoFechaHora = (fecha) => {
    if (!fecha) return "";
    const dia = String(fecha.getDate()).padStart(2, "0");
    const mesNumero = fecha.getMonth();
    const hora = fecha.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    return `${dia} de ${meses[mesNumero]}, ${hora}`;
  };

  const fraseActual = frases[indiceFrase];

  return (
    <div className={`pantalla ${resaltar ? "fondo-oscuro" : ""}`} style={{ backgroundImage: `url(${fondo})` }}>
      <div className="columna-izquierda">
        <div className="encabezado">
          <div className="hora">{formatoFechaHora(horaActual)}</div>
        </div>
        <div className="mensaje">
          <div className="logo-central" style={{ marginTop: fraseActual.estiloLogo.marginTop || "0px" }}>
            {fraseActual.logo && (
              <img
                src={fraseActual.logo}
                alt="Frase"
                className={`logo-central-img ${mostrarLogo ? "mostrar" : ""}`}
                style={{
                  maxHeight: fraseActual.estiloLogo.maxHeight,
                  maxWidth: fraseActual.estiloLogo.maxWidth,
                  display: fraseActual.estiloLogo.display || "block",
                }}
              />
            )}
          </div>
          <h2 className="titulo-principal">{fraseActual.titulo}</h2>
          <div className="subtitulo-principal">{fraseActual.subtitulo}</div>
        </div>
      </div>

      <div className="columna-derecha">
        <div className="encabezado-tabla">
          <div>TURNO</div>
          <div>MÓDULO</div>
          <div>NOMBRE</div>
        </div>
        <div className="tabla-contenido">
          {turnos.length === 0 ? (
            <div className="sin-turnos">No hay turnos disponibles</div>
          ) : (
            turnos.map((turno, index) => (
              <div key={index} className={`fila ${index === 0 && resaltar ? "fila-resaltada" : index === 0 ? "fila-activa" : "fila-pasiva"}`}>
                <div>{turno.turno}</div>
                <div>{turno.modulo.replace(/\D/g, "")}</div>
                <div>{turno.patientName}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="marquesina">
        <div className="marquesina-text animar">
          Bienvenidos al Hospital Universitario San José de Popayán - Innovación e Investigación 2025 - Telemedicina disponible para particulares{" "}
          <FontAwesomeIcon icon={faWhatsapp} style={{ color: "#25D366", margin: "0 6px", verticalAlign: "middle" }} />
          <a href="https://wa.me/573168331579" target="_blank" rel="noopener noreferrer" style={{ color: "#ffffff", textDecoration: "underline", fontWeight: "bold" }}>
            316-833-1579
          </a>
        </div>
      </div>
    </div>
  );
}

export default CallPacientes;
