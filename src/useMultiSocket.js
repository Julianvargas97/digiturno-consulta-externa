import React, { useEffect, useState, useCallback, useRef } from "react";
import useSocket from "./useSocket"; // Hook personalizado para conectar a un solo canal

// Componente interno que se encarga de conectar a una especialidad
function SingleSocket({ speciality, onMessage, registerSendMessage }) {
  const { data, sendMessage } = useSocket(`ExternalConsultationArrival_${speciality}`);

  // Ref para mantener la referencia actualizada a onMessage
  const latestOnMessage = useRef(onMessage);

  // Actualiza la referencia cada vez que onMessage cambia
  useEffect(() => {
    latestOnMessage.current = onMessage;
  }, [onMessage]);

  // Ejecuta onMessage cuando llega data nueva, usando la referencia más reciente
  useEffect(() => {
    if (data) {
      latestOnMessage.current(data);
    }
  }, [data]);

  // Registrar la función sendMessage para esta especialidad
  useEffect(() => {
    if (sendMessage) {
      registerSendMessage(speciality, sendMessage);
    }
  }, [sendMessage, registerSendMessage, speciality]);

  return null;
}

// Componente que engloba todos los sockets activos
function MultiSocketComponents({ specialities, onMessage, registerSendMessage }) {
  return (
    <>
      {specialities.map((spec) => (
        <SingleSocket
          key={`${spec}`} // Puedes agregar más info aquí si necesitas forzar recreación
          speciality={spec}
          onMessage={onMessage}
          registerSendMessage={registerSendMessage}
        />
      ))}
    </>
  );
}

// Hook principal para múltiples especialidades
export default function useMultiSocket(specialities = [], onMessages) {
  const [allMessages, setAllMessages] = useState({});
  const sendMessageMap = useRef({}); // Map de funciones sendMessage

  // Registrar una función sendMessage para cada especialidad
  const registerSendMessage = useCallback((speciality, fn) => {
    sendMessageMap.current[speciality] = fn;
  }, []);

  // Función para enviar mensaje a especialidad específica
  const sendMessage = useCallback((speciality, message) => {
    const fn = sendMessageMap.current[speciality];
    if (fn) {
      fn(message);
    } else {
      console.warn(`No hay función de envío para la especialidad: ${speciality}`);
    }
  }, []);

  // La función onMessages pasada la usamos directamente para manejar mensajes
  const handleMessage = onMessages;

  return {
    allMessages,
    sendMessage,
    MultiSocketComponents: (
      <MultiSocketComponents
        specialities={specialities}
        onMessage={handleMessage}
        registerSendMessage={registerSendMessage}
      />
    ),
  };
}
