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

  // Sécurité pour les données
  const safeCurrent = typeof currentPos === 'number' ? currentPos : 0;
  const safeTarget = typeof targetPos === 'number' ? targetPos : 0;

  // Synchronisation du volet gris (réel)
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
          {/* FOND : Ciel bleu (Z-Index 1) */}
          <Box style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, #4facfe, #00f2fe)', zIndex: 1 }} />

          {/* LE VOLET RÉEL (Gris) - Descendu d'un cran (Z-Index 2) */}
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
                zIndex: 2, // <-- Changé ici : Z-Index 2 (derrière le Ghost)
                backgroundColor: '#373A40',
                backgroundImage: 'linear-gradient(rgba(0,0,0,0.2) 1px, transparent 1px)',
                backgroundSize: '100% 15px',
                cursor: isDragging ? 'grabbing' : 'pointer'
              }}
          >
            {/* Lame finale noire */}
            <Box style={{ position: 'absolute', bottom: 0, width: '100%', height: 10, background: '#1A1B1E' }} />
          </motion.div>

          {/* --- LE GHOST (Indicateur de cible) - Monté d'un cran (Z-Index 3) --- */}
          {Math.abs(safeTarget - safeCurrent) > 1 && (
              <Box
                  style={{
                    width: '100%',
                    height: `${safeTarget}%`,
                    position: 'absolute',
                    top: 0,
                    zIndex: 3, // <-- Changé ici : Z-Index 3 (devant le Volet Réel)
                    // Ombre translucide pour indiquer la cible
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    // Ligne de limite basse blanche très fine
                    borderBottom: '2px solid rgba(255, 255, 255, 0.5)',
                    pointerEvents: 'none',
                    transition: 'height 0.3s ease-out'
                  }}
              />
          )}

          {/* REFLET SUR LA VITRE (Z-Index 4) */}
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