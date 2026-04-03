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
  const [isConnected, setIsConnected] = useState(false);
  const [isSynced, setIsSynced] = useState(false);
  const [realStatus, setRealStatus] = useState('SYNCHRONISATION...');

  const [position, setPosition] = useState(0);
  const [targetPosition, setTargetPosition] = useState(0);

  // Topics
  const TOPIC_CMD = `maison/volet/${roomId}/commande`;
  const TOPIC_ETAT = `maison/volet/${roomId}/etat`;
  const TOPIC_POS_FEEDBACK = `maison/volet/${roomId}/position`;
  const TOPIC_POS_SET = `maison/volet/${roomId}/set`;

  useEffect(() => {
    const client = mqtt.connect(MQTT_URL, { reconnectPeriod: 5000 });

    client.on('connect', () => {
      setIsConnected(true);
      client.subscribe([TOPIC_ETAT, TOPIC_POS_FEEDBACK]);
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
          if (!isSynced) {
            setTargetPosition(newPos);
            setIsSynced(true);
          }
          if (Math.abs(newPos - targetPosition) < 1) {
            setTargetPosition(newPos);
          }
        }
      }
    });

    client.on('offline', () => {
      setIsConnected(false);
      setRealStatus('SERVEUR DÉCONNECTÉ');
    });

    mqttClientRef.current = client;
    return () => {
      if (mqttClientRef.current) mqttClientRef.current.end();
    };
  }, [roomId, isSynced, targetPosition, TOPIC_ETAT, TOPIC_POS_FEEDBACK]);

  const handleSetPosition = (newPos: number) => {
    if (mqttClientRef.current?.connected) {
      setTargetPosition(newPos);
      mqttClientRef.current.publish(TOPIC_POS_SET, newPos.toString());
    }
  };

  const sendCmd = (cmd: string) => {
    if (mqttClientRef.current?.connected) {
      mqttClientRef.current.publish(TOPIC_CMD, cmd);
      if (cmd === 'OUVRIR') setTargetPosition(0);
      if (cmd === 'FERMER') setTargetPosition(100);
    }
  };

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
        {/* ORGANISME VISUEL */}
        <Center>
          <ShutterVisual
              currentPos={position}
              targetPos={targetPosition}
              onSetPosition={handleSetPosition}
              isOnline={isEspOnline}
          />
        </Center>

        {/* SECTION STATUS (Molécule intégrée) */}
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

        {/* MOLÉCULE DE CONTRÔLE */}
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