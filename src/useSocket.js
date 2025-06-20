import { useState, useEffect, useRef, useMemo } from 'react';
import { Client } from '@stomp/stompjs';

// Definición de los destinos de socket
export const DestSocket = {
  ARRIVAL: 'ARRIVAL',
  WAITING: 'WAITING',
  CONSULT: 'CONSULT',
  ARRIVAL_CALL: 'ARRIVAL_CALL',
  DELIVER: 'DELIVER',
  ANNOUNCE_TO_BILLING: 'ANNOUNCE_TO_BILLING',
  ExternalConsultationArrival_QR: 'ExternalConsultationArrival_QR',
  ExternalConsultationArrival_CIRUGIA_PROGRAMADA: 'ExternalConsultationArrival_CIRUGIA_PROGRAMADA',
  ExternalConsultationArrival_SOAT: 'ExternalConsultationArrival_SOAT',
  ExternalConsultationArrival_ARI: 'ExternalConsultationArrival_ARI',
  ExternalConsultationArrival_GENERAL: 'ExternalConsultationArrival_GENERAL',
  ExternalConsultationArrival_MEDICINA_PREPAGADA: 'ExternalConsultationArrival_MEDICINA_PREPAGADA',
  ExternalConsultationArrival_PRUEBAS_MAGISTRALES: 'ExternalConsultationArrival_PRUEBAS_MAGISTRALES',
  ExternalConsultationArrival_INFUSIONES: 'ExternalConsultationArrival_INFUSIONES',
  ExternalConsultationArrival_RECAUDOS: 'ExternalConsultationArrival_RECAUDOS',
  ExternalConsultationArrival_CURACIONES: 'ExternalConsultationArrival_CURACIONES',
  ExternalConsultationArrival_LABORATORIOS: 'ExternalConsultationArrival_LABORATORIOS',
  ExternalConsultationArrival_ATENCION_PREFERENCIAL: 'ExternalConsultationArrival_ATENCION_PREFERENCIAL',
  ExternalConsultationArrival_ONCOLOGIA: 'ExternalConsultationArrival_ONCOLOGIA',
  ExternalConsultationArrival_CHATBOT: 'ExternalConsultationArrival_CHATBOT',
  ExternalConsultationArrival_POSTQUIRURGICO: 'ExternalConsultationArrival_POSTQUIRURGICO',
  ExternalConsultationArrival_APOYO: 'ExternalConsultationArrival_APOYO',
  ExternalConsultationArrival_ANOUNCETOBILLING: 'ExternalConsultationArrival_ANOUNCETOBILLING',
};

// Rutas asociadas a cada destino
const topicRoutes = {
  [DestSocket.ARRIVAL]: '/topic/external-consultation/arrival-confirmation',
  [DestSocket.WAITING]: '/topic/external-consultation/waiting-consult',
  [DestSocket.CONSULT]: '/topic/consult',
  [DestSocket.ARRIVAL_CALL]: '/topic/arrivalcall',
  [DestSocket.DELIVER]: '/topic/deliver_results',
  [DestSocket.ANNOUNCE_TO_BILLING]: '/topic/announce-to-billing',
  [DestSocket.ExternalConsultationArrival_QR]: '/topic/external-consultation/arrival-confirmation/QR',
  [DestSocket.ExternalConsultationArrival_CIRUGIA_PROGRAMADA]: '/topic/external-consultation/arrival-confirmation/CIRUGIA_PROGRAMADA',
  [DestSocket.ExternalConsultationArrival_SOAT]: '/topic/external-consultation/arrival-confirmation/SOAT',
  [DestSocket.ExternalConsultationArrival_ARI]: '/topic/external-consultation/arrival-confirmation/ARI',
  [DestSocket.ExternalConsultationArrival_GENERAL]: '/topic/external-consultation/arrival-confirmation/GENERAL',
  [DestSocket.ExternalConsultationArrival_MEDICINA_PREPAGADA]: '/topic/external-consultation/arrival-confirmation/MEDICINA_PREPAGADA',
  [DestSocket.ExternalConsultationArrival_PRUEBAS_MAGISTRALES]: '/topic/external-consultation/arrival-confirmation/PRUEBAS_MAGISTRALES',
  [DestSocket.ExternalConsultationArrival_INFUSIONES]: '/topic/external-consultation/arrival-confirmation/INFUSIONES',
  [DestSocket.ExternalConsultationArrival_RECAUDOS]: '/topic/external-consultation/arrival-confirmation/RECAUDOS',
  [DestSocket.ExternalConsultationArrival_CURACIONES]: '/topic/external-consultation/arrival-confirmation/CURACIONES',
  [DestSocket.ExternalConsultationArrival_LABORATORIOS]: '/topic/external-consultation/arrival-confirmation/LABORATORIOS',
  [DestSocket.ExternalConsultationArrival_ATENCION_PREFERENCIAL]: '/topic/external-consultation/arrival-confirmation/ATENCION_PREFERENCIAL',
  [DestSocket.ExternalConsultationArrival_ONCOLOGIA]: '/topic/external-consultation/arrival-confirmation/ONCOLOGIA',
  [DestSocket.ExternalConsultationArrival_CHATBOT]: '/topic/external-consultation/arrival-confirmation/CHATBOT',
  [DestSocket.ExternalConsultationArrival_POSTQUIRURGICO]: '/topic/external-consultation/arrival-confirmation/POSTQUIRURGICO',
  [DestSocket.ExternalConsultationArrival_APOYO]: '/topic/external-consultation/arrival-confirmation/APOYO',
  [DestSocket.ExternalConsultationArrival_ANOUNCETOBILLING]: '/topic/external-consultation/announce-to-billing',
};

// URL del servidor WebSocket
const url = 'ws://192.168.17.236:5000/websocket';

// Hook personalizado para manejar la conexión WebSocket
const useSocket = (destSocket) => {
  const [messages, setMessages] = useState(null);
  const [data, setData] = useState([]);
  const [waitingList, setWaitingList] = useState([]);
  const [inputMessage, setInputMessage] = useState('');

  const clientRef = useRef(null);
  const subscriptionRef = useRef(null);

  const memoDestSocket = useMemo(() => destSocket, [destSocket]);

  useEffect(() => {
    if (!memoDestSocket) return;

    const client = new Client({
      brokerURL: url,
      connectHeaders: {},
      debug: (str) => console.log('[STOMP] ------', str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      console.log('Conectado al servidor WebSocket ------->', memoDestSocket);

      const topic = topicRoutes[memoDestSocket];
      console.log('INTENTO DE CONEXION A:', topic);

      const sub = client.subscribe(topic, (message) => {
        const messageContent = message.body;
        console.log(`MENSAJE DESDE ${memoDestSocket}`, messageContent);
        try {
          setData(JSON.parse(messageContent));
        } catch (error) {
          console.error('Error al parsear el mensaje', error);
        }
      });

      subscriptionRef.current = sub;
    };

    client.onDisconnect = () => {
      console.log('Desconectado del servidor WebSocket');
    };

    client.activate();
    clientRef.current = client;

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      if (clientRef.current && clientRef.current.connected) {
        clientRef.current.deactivate();
      }
    };
  }, [memoDestSocket]);

  return {
    messages,
    inputMessage,
    setInputMessage,
    data,
    waitingList,
  };
};

export default useSocket;
