import {useEffect, useRef, useState} from 'react';
import {ActionIcon, Badge, Button, Center, Group, Loader, Paper, Stack, Text} from '@mantine/core';
import {IconChevronDown, IconChevronUp, IconSquare, IconTarget} from '@tabler/icons-react';
import mqtt from 'mqtt';
import ShutterVisual from './ShutterVisual';

const MQTT_URL = 'ws://192.168.1.19:9001';

export default function VoletController({roomId}: { roomId: string }) {
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
    const client = mqtt.connect(MQTT_URL, {reconnectPeriod: 5000});

    client.on('connect', () => {
      setIsConnected(true);
      // On utilise les variables locales définies juste au-dessus
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
    // AJOUT DES DÉPENDANCES MANQUANTES ICI
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
  const isEspOnline = isConnected && realStatus !== 'HORS LIGNE' && realStatus !== 'SERVEUR DÉCONNECTÉ' && realStatus !== 'SYNCHRONISATION...';

  if (!isSynced) {
    return (
        <Center h={350}>
          <Stack align="center" gap="xs">
            <Loader color="dark" size="sm"/>
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
              <Text size="xs" fw={900} c="dimmed" style={{letterSpacing: '1px'}}>SYSTÈME</Text>
              <Group gap={6}>
                {isMoving && <Loader size={12} color="blue"/>}
                <Text fw={800} size="sm" c={isMoving ? "blue" : "dark"}>
                  {realStatus.toUpperCase()}
                </Text>
              </Group>
            </Stack>
            {Math.abs(targetPosition - position) > 1 ? (
                <Badge
                    variant="outline"
                    leftSection={<IconTarget size={14} color="gray"/>}
                    size="lg"
                    radius="sm"
                >
                  OBJECTIF : {targetPosition}%
                </Badge>
            ) : (
                <Badge
                    variant="outline"
                    color={isEspOnline ? 'green' : 'red'}
                    size="lg"
                    radius="sm"
                >
                  {isEspOnline ? 'ESP32 CONNECTÉ' : 'HORS LIGNE'}
                </Badge>)
            }
          </Group>
        </Stack>

        <Paper withBorder p="md" radius="md" bg="gray.0">
          <Stack gap="md">
            <Group grow gap="xs">
              <Button
                  variant="filled"
                  color="dark"
                  radius="md"
                  leftSection={<IconChevronUp size={20}/>}
                  onClick={() => sendCmd('OUVRIR')}
                  disabled={!isEspOnline || position === 0 || isMoving}
              >
                MONTER
              </Button>

              <ActionIcon
                  variant="outline"
                  color="gray"
                  size="lg"
                  h={36}
                  radius="md"
                  onClick={() => sendCmd('STOP')}
                  disabled={!isEspOnline}
              >
                <IconSquare size={18} fill="currentColor"/>
              </ActionIcon>

              <Button
                  variant="filled"
                  color="dark"
                  radius="md"
                  leftSection={<IconChevronDown size={20}/>}
                  onClick={() => sendCmd('FERMER')}
                  disabled={!isEspOnline || position === 100 || isMoving}
              >
                DESCENDRE
              </Button>
            </Group>
          </Stack>
        </Paper>

        <Text size="xs" c="dimmed" ta="center">
          Astuce : Cliquez sur la vitre ou glissez le volet pour piloter.
        </Text>
      </Stack>
  );
}