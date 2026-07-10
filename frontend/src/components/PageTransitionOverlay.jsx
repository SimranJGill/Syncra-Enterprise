import React from 'react';
import { motion } from 'framer-motion';

export default function PageTransitionOverlay({ onComplete, isDarkMode }) {
  const bg = isDarkMode ? '#030712' : '#f8fafc';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      pointerEvents: 'none',
      zIndex: 9999,
      display: 'flex'
    }}>
      {/* Left panel */}
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: '-100%' }}
        transition={{ duration: 0.45, ease: [0.65, 0, 0.35, 1] }}
        onAnimationComplete={() => {
          if (onComplete) onComplete();
        }}
        style={{
          width: '50%',
          height: '100%',
          backgroundColor: bg,
          pointerEvents: 'auto'
        }}
      />
      {/* Right panel */}
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: '100%' }}
        transition={{ duration: 0.45, ease: [0.65, 0, 0.35, 1] }}
        style={{
          width: '50%',
          height: '100%',
          backgroundColor: bg,
          pointerEvents: 'auto'
        }}
      />
    </div>
  );
}
