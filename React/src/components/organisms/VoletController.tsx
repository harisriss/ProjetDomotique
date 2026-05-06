import { useEffect, useRef, useState } from 'react';
import { Center, Group, Loader, Stack, Text } from '@mantine/core';
import mqtt from 'mqtt';

// Importations Atomic Design
import { StatLabel } from '../atoms/StatLabel';
import { StatusIndicator } from '../atoms/StatusIndicator';
import { ShutterControls } from '../molecules/ShutterControls';
import ShutterVisual from './ShutterVisual';

const MQTT_URL = 'ws://192.168.1.19:9001';

export default function VoletController({ roomId }: { roomId: string }) {
  const mqttClientRef = useRef<mqtt.MqttClient | null>(null);

  // États de connexion et synchro
  const [isConnected, setIsConnected] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [realStatus, setRealStatus] = useState('SYNCHRONISATION...');

  // États de position
  const [position, setPosition] = useState(0);
  const [targetPosition, setTargetPosition] = useState(0);

  // Topics (calculés une fois par roomId)
  const TOPIC_CMD = `maison/volet/${roomId}/commande`;
  const TOPIC_ETAT = `maison/volet/${roomId}/etat`;
  const TOPIC_POS_FEEDBACK = `maison/volet/${roomId}/position`;
  const TOPIC_POS_SET = `maison/volet/${roomId}/set`;

  // Gestion de la connexion MQTT
  useEffect(() => {
    const client = mqtt.connect(MQTT_URL, {
      reconnectPeriod: 5000,
      clientId: `web_client_${roomId}_${Math.random().toString(16).slice(2, 8)}`
    });

    client.on('connect', () => {
      setIsConnected(true);
      client.subscribe([TOPIC_ETAT, TOPIC_POS_FEEDBACK]);
      console.log(`✅ Connecté au volet : ${roomId}`);
    });

    client.on('message', (topic, message) => {
      const msgStr = message.toString();

      if (topic === TOPIC_ETAT) {
        setRealStatus(msgStr);
      }

      if (topic === TOPIC_POS_FEEDBACK) {
        const newPos = parseInt(msgStr, 10);
        if (!isNaN(newPos)) {
          setPosition(newPos);

          // On ne synchronise la cible qu'au premier message reçu
          setIsSynced((prevSynced) => {
            if (!prevSynced) setTargetPosition(newPos);
            return true;
          });
        }
      }
    });

    client.on('offline', () => {
      setIsConnected(false);
      setRealStatus('SERVEUR DÉCONNECTÉ');
    });

    mqttClientRef.current = client;

    return () => {
      console.log(`🔌 Déconnexion du volet : ${roomId}`);
      if (client) client.end();
    };
  }, [roomId]); // UNIQUEMENT roomId ici.

  // Actions de pilotage
  const handleSetPosition = (newPos: number) => {
    if (mqttClientRef.current?.connected) {
      setTargetPosition(newPos);
      mqttClientRef.current.publish(TOPIC_POS_SET, newPos.toString(), { qos: 1 });
    }
  };

  const sendCmd = (cmd: string) => {
    if (mqttClientRef.current?.connected) {
      mqttClientRef.current.publish(TOPIC_CMD, cmd, { qos: 1 });

      if (cmd === 'OUVRIR') setTargetPosition(0);
      if (cmd === 'FERMER') setTargetPosition(100);
      if (cmd === 'STOP') setTargetPosition(position); // On fige la cible sur la position actuelle
    }
  };

  // Logique d'affichage
  const isMoving = realStatus.includes('...');
  const isEspOnline = isConnected && !['HORS LIGNE', 'SERVEUR DÉCONNECTÉ', 'SYNCHRONISATION...'].includes(realStatus);

  if (!isSynced) {
    return (
        <Center h={350}>
          <Stack align="center" gap="xs">
            <Loader color="dark" size="sm" />
            <Text size="xs" fw={700} c="dimmed">RÉCUPÉRATION DU VOLET...</Text>
          </Stack>
        </Center>
    );
  }

  return (
      <Stack gap="xl">
        <Center>
          <ShutterVisual
              currentPos={position}
              targetPos={targetPosition}
              onSetPosition={handleSetPosition}
              isOnline={isEspOnline}
          />
        </Center>

        <Stack gap={8}>
          <Group justify="space-between" align="center">
            <Stack gap={0}>
              <StatLabel>Système</StatLabel>
              <Group gap={6}>
                {isMoving && <Loader size={12} color="blue" />}
                <Text fw={800} size="sm" c={isMoving ? "blue" : "dark"}>
                  {realStatus.toUpperCase()}
                </Text>
              </Group>
            </Stack>

            {Math.abs(targetPosition - position) > 1
                ? <StatusIndicator type="target" value={targetPosition} />
                : <StatusIndicator type="connection" value="" online={isEspOnline} />
            }
          </Group>
        </Stack>

        <ShutterControls
            onCmd={sendCmd}
            isOnline={isEspOnline}
            isMoving={isMoving}
            position={position}
        />

        <Text size="xs" c="dimmed" ta="center">
          Astuce : Cliquez sur la vitre ou glissez le volet pour piloter.
        </Text>
      </Stack>
  );
}