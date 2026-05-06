import { Text, Group, Badge, Paper } from '@mantine/core';

export const LogEntry = ({ line }: { line: string }) => {
  const isCommand = line.includes('commande') || line.includes('OUVRIR') || line.includes('FERMER') || line.includes('set');
  const datePart = line.split('] ')[0]?.replace('[', '') || '';
  const messagePart = line.split('] ')[1] || line;

  return (
      <Paper withBorder p="xs" radius="xs" mb={4} bg="dark.8">
        <Group justify="space-between" wrap="nowrap">
          <Text size="xs" c="dimmed" ff="monospace">{datePart}</Text>
          <Badge size="xs" variant="dot" color={isCommand ? "orange" : "blue"}>
            {isCommand ? "ACTION" : "INFOS"}
          </Badge>
        </Group>
        <Text size="sm" ff="monospace" c="gray.3" mt={4} style={{ wordBreak: 'break-all' }}>
          {messagePart}
        </Text>
      </Paper>
  );
};