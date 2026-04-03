import { Text } from '@mantine/core';

export const StatLabel = ({ children }: { children: React.ReactNode }) => (
    <Text size="xs" fw={900} c="dimmed" style={{ letterSpacing: '1px', textTransform: 'uppercase' }}>
      {children}
    </Text>
);