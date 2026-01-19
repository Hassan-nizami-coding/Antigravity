/**
 * Audio Visualizer Component
 * Shows recording duration and audio waveform
 */

import { motion, AnimatePresence } from 'framer-motion';
import { formatDuration } from '../utils';

// ===========================================
// Types
// ===========================================

interface AudioVisualizerProps {
  isRecording: boolean;
  duration: number;
  audioLevel: number;
}

// ===========================================
// Component
// ===========================================

export function AudioVisualizer({
  isRecording,
  duration,
  audioLevel,
}: AudioVisualizerProps) {
  // Generate bar heights based on audio level
  const barCount = 20;
  const bars = Array.from({ length: barCount }, (_, i) => {
    const centerDistance = Math.abs(i - barCount / 2) / (barCount / 2);
    const baseHeight = 0.3 + (1 - centerDistance) * 0.4;
    const dynamicHeight = audioLevel * (1 - centerDistance * 0.5);
    return Math.min(1, baseHeight + dynamicHeight);
  });

  return (
    <AnimatePresence>
      {isRecording && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="w-full max-w-md mx-auto mt-8"
        >
          {/* Duration display */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <span className="text-4xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-700 dark:from-primary-300 dark:to-primary-500 tabular-nums tracking-wider drop-shadow-sm">
              {formatDuration(duration)}
            </span>
          </motion.div>

          {/* Waveform visualization */}
          <div className="flex items-center justify-center gap-1.5 h-24">
            {bars.map((height, i) => (
              <motion.div
                key={i}
                className="w-2 rounded-full bg-gradient-to-t from-primary-400 to-primary-600 dark:from-primary-500 dark:to-primary-300 shadow-[0_0_10px_rgba(45,212,191,0.5)]"
                initial={{ height: '10%' }}
                animate={{
                  height: `${Math.max(10, height * 100)}%`,
                  opacity: 0.6 + height * 0.4,
                }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 15,
                  delay: i * 0.02,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AudioVisualizer;
