import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { Box, Text, Stack } from '@mantine/core';

interface ShutterVisualProps {
  currentPos: number;
  targetPos: number;
  onSetPosition: (pos: number) => void;
  isOnline: boolean;
}

const ShutterVisual: React.FC<ShutterVisualProps> = ({
                                                       currentPos,
                                                       targetPos,
                                                       onSetPosition,
                                                       isOnline
                                                     }) => {
  const windowHeight = 320;
  const yReal = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sécurité sur les entrées
  const safeCurrent = typeof currentPos === 'number' ? currentPos : 0;
  const safeTarget = typeof targetPos === 'number' ? targetPos : 0;

  useEffect(() => {
    if (!isDragging) {
      const targetY = (safeCurrent / 100) * windowHeight;
      animate(yReal, targetY, {
        type: "spring",
        stiffness: 100,
        damping: 20,
      });
    }
  }, [safeCurrent, isDragging, yReal]);

  const handleDragEnd = () => {
    setIsDragging(false);
    const currentY = yReal.get();
    const newPosPercent = Math.round((currentY / windowHeight) * 100);
    onSetPosition(Math.max(0, Math.min(100, newPosPercent)));
  };

  const handleWindowClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isOnline || isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const newPosPercent = Math.round((clickY / windowHeight) * 100);
    onSetPosition(Math.max(0, Math.min(100, newPosPercent)));
  };

  return (
      <Stack align="center" gap="sm">
        <Box
            ref={containerRef}
            onClick={handleWindowClick}
            style={{
              width: 200,
              height: windowHeight,
              position: 'relative',
              backgroundColor: '#050505',
              borderRadius: '12px',
              overflow: 'hidden',
              outline: '8px solid #2C2E33',
              boxShadow: '0 15px 35px rgba(0,0,0,0.4)',
              cursor: isOnline ? 'default' : 'not-allowed',
              userSelect: 'none',
              margin: '8px',
              zIndex: 0
            }}
        >
          {/* FOND : Ciel bleu */}
          <Box style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #4facfe, #00f2fe)', zIndex: 1 }} />

          {/* VOLET RÉEL (Gris) - Z-Index 2 pour être derrière le Ghost au cas où on remonte */}
          <motion.div
              drag={isOnline ? "y" : false}
              dragConstraints={{ top: 0, bottom: windowHeight }}
              dragElastic={0}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
              style={{
                y: yReal,
                width: '100%',
                height: '100%',
                position: 'absolute',
                top: -windowHeight,
                zIndex: 2,
                backgroundColor: '#373A40',
                backgroundImage: 'linear-gradient(rgba(0,0,0,0.2) 1px, transparent 1px)',
                backgroundSize: '100% 15px',
                cursor: isDragging ? 'grabbing' : 'pointer'
              }}
          >
            <Box style={{ position: 'absolute', bottom: 0, width: '100%', height: 10, background: '#1A1B1E' }} />
          </motion.div>

          {/* GHOST (Cible) - Z-Index 3 pour rester visible même pendant la remontée */}
          {Math.abs(safeTarget - safeCurrent) > 1 && (
              <Box
                  style={{
                    width: '100%',
                    height: `${safeTarget}%`,
                    position: 'absolute',
                    top: 0,
                    zIndex: 3,
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    borderBottom: '2px solid rgba(255, 255, 255, 0.5)',
                    pointerEvents: 'none',
                    transition: 'height 0.3s ease-out'
                  }}
              />
          )}

          {/* REFLET VITRE */}
          <Box style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)', pointerEvents: 'none', zIndex: 4 }} />
        </Box>

        <Stack gap={0} align="center">
          <Text fw={900} size="xl" style={{ lineHeight: 1 }}>
            {Math.round(safeCurrent)}%
          </Text>
          <Text fw={700} size="xs" c="dimmed" style={{ letterSpacing: '1px' }}>
            FERMÉ
          </Text>
        </Stack>
      </Stack>
  );
};

export default ShutterVisual;