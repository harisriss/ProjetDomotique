import { useState } from 'react';
import { Modal, Container, Title, Stack, Box, Text } from '@mantine/core';
import ApartmentPlan from "../templates/ApartmentPlan.tsx";
import VoletController from "../organisms/VoletController.tsx";

export default function Dashboard() {
  const [opened, setOpened] = useState(false);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);

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
              {/* Le Template du plan */}
              <ApartmentPlan onRoomClick={handleOpenRoom} activeRoomId={activeRoom} />
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
  );
}