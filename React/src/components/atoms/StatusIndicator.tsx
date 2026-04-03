import { Badge } from '@mantine/core';
import { IconTarget } from '@tabler/icons-react';

interface StatusIndicatorProps {
  type: 'connection' | 'target';
  value: string | number;
  online?: boolean;
}

export const StatusIndicator = ({ type, value, online }: StatusIndicatorProps) => {
  if (type === 'target') {
    return (
        <Badge variant="outline" leftSection={<IconTarget size={14} color="gray"/>} size="lg" radius="sm">
          OBJECTIF : {value}%
        </Badge>
    );
  }
  return (
      <Badge variant="outline" color={online ? 'green' : 'red'} size="lg" radius="sm">
        {online ? 'ESP32 CONNECTÉ' : 'HORS LIGNE'}
      </Badge>
  );
};