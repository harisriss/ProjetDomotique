import { useState } from 'react';
import { Modal, Container, Title, Stack, Box, Text, MantineProvider } from '@mantine/core';
import PlanAppartement from './PlanAppartement';
import VoletController from './VoletController';

export default function App() {
  const [opened, setOpened] = useState(false);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);

  const handleOpenRoom = (roomId: string) => {
    setActiveRoom(roomId);
    setOpened(true);
  };

  return (
      <MantineProvider>
        <Box style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
          <Container size="xl" py={40}>
            <Stack align="center" gap={40}>
              <Stack align="center" gap={0}>
                <Title order={1} fw={900} style={{ letterSpacing: '-1px' }}>MA MAISON</Title>
                <Text c="dimmed" fw={700} size="sm">PLAN INTERACTIF</Text>
              </Stack>

              <Box style={{ width: '100%', maxWidth: '900px' }}>
                <PlanAppartement onRoomClick={handleOpenRoom} />
              </Box>
            </Stack>

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
      </MantineProvider>
  );
}