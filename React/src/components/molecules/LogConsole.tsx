import { useEffect, useState, useRef } from 'react';
import { Drawer, ScrollArea, Stack, Title, ActionIcon, Group } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import mqtt from 'mqtt';
import { LogEntry } from '../atoms/LogEntry';

const MQTT_URL = 'ws://192.168.1.19:9001';

export const LogConsole = ({ opened, onClose }: { opened: boolean; onClose: () => void }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const mqttClientRef = useRef<mqtt.MqttClient | null>(null);
  const viewport = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!opened) return;

    const client = mqtt.connect(MQTT_URL);
    mqttClientRef.current = client;

    client.on('connect', () => {
      client.subscribe(['maison/volet/logs/history', 'maison/volet/#']);
      client.publish('maison/volet/logs/get', 'request_history');
    });

    client.on('message', (topic, message) => {
      const msgStr = message.toString();
      if (topic === 'maison/volet/logs/history') {
        const history = msgStr.split('\n').filter(l => l.trim() !== "");
        setLogs(history);
      } else if (!topic.includes('logs/get')) {
        const timestamp = new Date().toLocaleString();
        setLogs(prev => [...prev, `[${timestamp}] ${topic} ${msgStr}`]);
      }
    });

    return () => { if (client) client.end(); };
  }, [opened]);

  useEffect(() => {
    viewport.current?.scrollTo({ top: viewport.current.scrollHeight, behavior: 'smooth' });
  }, [logs]);

  return (
      <Drawer opened={opened} onClose={onClose} title={<Title order={4}>LOGS SYSTÈME</Title>} position="right" size="md">
        <Stack h="calc(100vh - 80px)">
          <Group justify="right">
            <ActionIcon variant="subtle" color="red" onClick={() => setLogs([])}><IconTrash size={18} /></ActionIcon>
          </Group>
          <ScrollArea h="100%" viewportRef={viewport}>
            <Stack gap={4}>
              {logs.map((log, i) => <LogEntry key={i} line={log} />)}
            </Stack>
          </ScrollArea>
        </Stack>
      </Drawer>
  );
};