import { useState } from 'react';
import { Modal, Container, Title, Stack, Box, Text, Affix, Button } from '@mantine/core';
import { IconTerminal2 } from '@tabler/icons-react';
import ApartmentPlan from "../templates/ApartmentPlan.tsx";
import VoletController from "../organisms/VoletController.tsx";
import {LogConsole} from "../molecules/LogConsole.tsx";

export default function Dashboard() {
  const [opened, setOpened] = useState(false);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);

  // Nouvel état pour la console de logs
  const [logsOpened, setLogsOpened] = useState(false);

  const handleOpenRoom = (roomId: string) => {
    setActiveRoom(roomId);
    setOpened(true);
  };

  return (
      <Box style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        <Container size="xl" py={40}>
          <Stack align="center" gap={40}>
            <Stack align="center" gap={0}>
              <Title order={1} fw={900} style={{ letterSpacing: '-1px' }}>
                MA MAISON
              </Title>
              <Text c="dimmed" fw={700} size="sm">PLAN INTERACTIF</Text>
            </Stack>

            <Box style={{ width: '100%', maxWidth: '900px' }}>
              <ApartmentPlan onRoomClick={handleOpenRoom} activeRoomId={activeRoom} />
            </Box>
          </Stack>

          {/* Bouton flottant pour ouvrir les logs */}
          <Affix position={{ bottom: 20, right: 20 }}>
            <Button
                leftSection={<IconTerminal2 size={16} />}
                onClick={() => setLogsOpened(true)}
                color="dark"
                radius="xl"
            >
              Console Logs
            </Button>
          </Affix>

          {/* Composant Console de Logs */}
          <LogConsole
              opened={logsOpened}
              onClose={() => setLogsOpened(false)}
          />

          <Modal
              opened={opened}
              onClose={() => setOpened(false)}
              title={<Text fw={900}>PILOTAGE : {activeRoom?.toUpperCase()}</Text>}
              centered
              size="md"
              radius="lg"
          >
            {activeRoom && <VoletController roomId={activeRoom} />}
          </Modal>
        </Container>
      </Box>
  );
}