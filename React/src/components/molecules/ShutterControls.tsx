// #TODO : fix buton label size
import { Group, Button, ActionIcon, Paper } from '@mantine/core';
import { IconChevronUp, IconChevronDown, IconSquare } from '@tabler/icons-react';

interface ShutterControlsProps {
  onCmd: (cmd: string) => void;
  isOnline: boolean;
  isMoving: boolean;
  position: number;
}

export const ShutterControls = ({ onCmd, isOnline, isMoving, position }: ShutterControlsProps) => (
    <Paper withBorder p="md" radius="md" bg="gray.0">
      <Group grow gap="xs">
        <Button
            variant="filled" color="dark" radius="md"
            leftSection={<IconChevronUp size={20}/>}
            onClick={() => onCmd('OUVRIR')}
            disabled={!isOnline || position === 0 || isMoving}
        >
          MONTER
        </Button>

        <ActionIcon
            variant="outline" color="gray" size="lg" h={36} radius="md"
            onClick={() => onCmd('STOP')}
            disabled={!isOnline}
        >
          <IconSquare size={18} fill="currentColor"/>
        </ActionIcon>

        <Button
            variant="filled" color="dark" radius="md"
            leftSection={<IconChevronDown size={20}/>}
            onClick={() => onCmd('FERMER')}
            disabled={!isOnline || position === 100 || isMoving}
        >
          DESCENDRE
        </Button>
      </Group>
    </Paper>
);