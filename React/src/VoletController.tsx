import { useState, useEffect, useRef } from 'react';
import { Text, Button, Group, Stack, Badge, Paper, Slider, Progress, Center, Loader } from '@mantine/core';
import { IconChevronUp, IconChevronDown, IconSquare, IconRefresh } from '@tabler/icons-react';
import mqtt from 'mqtt';

const MQTT_URL = 'ws://192.168.1.19:9001';

export default function VoletController({ roomId }: { roomId: string }) {
  const mqttClientRef = useRef<mqtt.MqttClient | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSynced, setIsSynced] = useState(false); // Nouveau : pour attendre la 1ère position
  const [realStatus, setRealStatus] = useState('SYNCHRONISATION...');
  const [position, setPosition] = useState(0);

  const TOPIC_CMD = `maison/volet/${roomId}/commande`;
  const TOPIC_ETAT = `maison/volet/${roomId}/etat`;
  const TOPIC_POS_FEEDBACK = `maison/volet/${roomId}/position`;
  const TOPIC_POS_SET = `maison/volet/${roomId}/set`;

  useEffect(() => {
    const client = mqtt.connect(MQTT_URL, { reconnectPeriod: 5000 });

    client.on('connect', () => {
      setIsConnected(true);
      client.subscribe([TOPIC_ETAT, TOPIC_POS_FEEDBACK, TOPIC_POS_SET]);
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
          setIsSynced(true); // On confirme qu'on a reçu la position réelle
        }
      }
    });

    client.on('offline', () => {
      setIsConnected(false);
      setRealStatus('SERVEUR DÉCONNECTÉ');
    });

    mqttClientRef.current = client;
    return () => { if (mqttClientRef.current) mqttClientRef.current.end(); };
  }, [roomId]);

  const sendCmd = (cmd: string) => {
    if (mqttClientRef.current?.connected) {
      mqttClientRef.current.publish(TOPIC_CMD, cmd);
    }
  };

  const isMoving = realStatus.includes('...');
  const isEspOnline = isConnected && realStatus !== 'HORS LIGNE' && realStatus !== 'SERVEUR DÉCONNECTÉ' && realStatus !== 'SYNCHRONISATION...';

  // Si on n'a pas encore reçu la position réelle, on affiche un loader
  // Cela garantit que le Slider sera créé AVEC la bonne valeur (ex: 83%)
  if (!isSynced) {
    return (
        <Center h={200}>
          <Stack align="center" gap="xs">
            <Loader color="dark" size="sm" />
            <Text size="xs" fw={700} c="dimmed">LECTURE DE LA POSITION...</Text>
          </Stack>
        </Center>
    );
  }

  return (
      <Stack gap="xl">
        <Paper withBorder p="lg" radius="md" bg="gray.0" style={{ display: 'flex', justifyContent: 'center' }}>
          <svg width="140" height="180" viewBox="0 0 100 120">
            <rect x="5" y="10" width="90" height="100" fill="white" stroke="#dee2e6" strokeWidth="2" />
            <rect x="5" y="10" width="90" height={position} fill="#495057" style={{ transition: 'height 0.4s linear' }} />
            {Array.from({ length: 11 }).map((_, i) => (
                <line key={i} x1="5" y1={10+(i*10)} x2="95" y2={10+(i*10)} stroke="rgba(255,255,255,0.15)" strokeWidth="1" visibility={position > (i*10) ? 'visible' : 'hidden'} />
            ))}
            <rect x="5" y={10+position-2} width="90" height="4" fill="#212529" visibility={position > 2 ? 'visible' : 'hidden'} style={{ transition: 'y 0.4s linear' }} />
          </svg>
        </Paper>

        <Stack gap={6}>
          <Group justify="space-between">
            <Text size="xs" fw={700} c="dimmed">POSITION : {position}%</Text>
            <Badge variant="filled" color={isEspOnline ? 'green' : 'red'}>
              {isEspOnline ? 'ESP32 EN LIGNE' : 'ESP32 DÉCONNECTÉ'}
            </Badge>
          </Group>
          <Progress
              value={position}
              size="xl"
              radius="sm"
              color="#495057"
              striped={isMoving}
              animated={isMoving}
              styles={{ section: { transition: 'width 0.4s linear' } }}
          />
        </Stack>

        <Stack gap={4}>
          <Text size="xs" fw={700} c="dimmed">CONSIGNE</Text>
          <Slider
              key={`${roomId}-${isSynced}`} // Force la création avec la valeur synchronisée
              defaultValue={position}
              onChangeEnd={(val) => {
                if (mqttClientRef.current?.connected) {
                  mqttClientRef.current.publish(TOPIC_POS_SET, val.toString());
                }
              }}
              color="dark"
              label={(val) => `${val}%`}
              disabled={!isEspOnline}
          />
        </Stack>

        <Paper p="xs" radius="sm" withBorder bg="gray.0">
          <Group justify="center" gap="xs">
            {isMoving && <IconRefresh size={14} className="animate-spin" color="gray" />}
            <Text fw={700} size="xs" c="dark">{realStatus.toUpperCase()}</Text>
          </Group>
        </Paper>

        <Group grow gap="sm">
          <Button variant="filled" color="dark" leftSection={<IconChevronUp size={18} />} onClick={() => sendCmd('OUVRIR')} disabled={!isEspOnline || position === 0 || isMoving}>OUVRIR</Button>
          <Button variant="outline" color="gray" onClick={() => sendCmd('STOP')} disabled={!isEspOnline}><IconSquare size={16} fill="currentColor" /></Button>
          <Button variant="filled" color="dark" leftSection={<IconChevronDown size={18} />} onClick={() => sendCmd('FERMER')} disabled={!isEspOnline || position === 100 || isMoving}>FERMER</Button>
        </Group>
      </Stack>
  );
}