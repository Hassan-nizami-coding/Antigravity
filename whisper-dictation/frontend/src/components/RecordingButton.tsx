/**
 * Recording Button Component
 * Animated microphone button with premium visual feedback
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Loader2 } from 'lucide-react';
import type { RecordingState } from '../types';
import { cn } from '../utils';

// ===========================================
// Types
// ===========================================

interface RecordingButtonProps {
  state: RecordingState;
  audioLevel: number;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

// ===========================================
// Component
// ===========================================

export function RecordingButton({
  state,
  audioLevel,
  onStart,
  onStop,
  disabled,
}: RecordingButtonProps) {
  const isRecording = state === 'recording';
  const isProcessing = state === 'processing' || state === 'requesting';

  const handleClick = () => {
    if (disabled || isProcessing) return;
    
    if (isRecording) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative flex items-center justify-center">
        {/* Pulsing rings for recording state */}
        <AnimatePresence>
          {isRecording && (
            <>
              {/* Audio level indicator - outer glow */}
              <motion.div
                initial={{ scale: 1, opacity: 0 }}
                animate={{
                  scale: 1.2 + audioLevel * 0.8,
                  opacity: 0.2 + audioLevel * 0.3,
                }}
                exit={{ scale: 1, opacity: 0 }}
                className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-red-400 to-red-600 blur-xl"
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              />
              
              {/* Pulse ring 1 */}
              <motion.div
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 2, opacity: 0 }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: 'easeOut',
                }}
                className="absolute w-28 h-28 rounded-full border-2 border-red-400"
              />
              
              {/* Pulse ring 2 - delayed */}
              <motion.div
                initial={{ scale: 1, opacity: 0.4 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{
                  repeat: Infinity,
                  duration: 1.5,
                  ease: 'easeOut',
                  delay: 0.5,
                }}
                className="absolute w-28 h-28 rounded-full border border-red-300"
              />
            </>
          )}
        </AnimatePresence>

        {/* Idle state ambient glow */}
        {!isRecording && !isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute w-32 h-32 rounded-full bg-gradient-to-br from-primary-400/30 to-primary-600/30 blur-2xl"
          />
        )}

        {/* Main button */}
        <motion.button
          onClick={handleClick}
          disabled={disabled || isProcessing}
          whileHover={{ 
            scale: disabled || isProcessing ? 1 : 1.08, 
            boxShadow: isRecording 
              ? "0 0 50px rgba(239, 68, 68, 0.5)" 
              : "0 0 40px rgba(45, 212, 191, 0.6)" 
          }}
          whileTap={{ scale: disabled || isProcessing ? 1 : 0.95 }}
          className={cn(
            'relative z-10 w-28 h-28 rounded-full',
            'flex items-center justify-center',
            'transition-all duration-500',
            'focus:outline-none focus:ring-4',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            
            isRecording
              ? 'bg-gradient-to-br from-red-400 to-red-600 focus:ring-red-500/30 shadow-2xl shadow-red-500/40'
              : isProcessing
                ? 'bg-surface-200 dark:bg-surface-700 cursor-wait shadow-lg'
                : 'bg-gradient-to-br from-primary-400 via-primary-500 to-primary-600 focus:ring-primary-500/30 shadow-2xl shadow-primary-500/40'
          )}
          style={{
            boxShadow: isRecording
              ? `0 0 ${30 + audioLevel * 60}px rgba(239, 68, 68, ${0.4 + audioLevel * 0.4}), 
                 inset 0 -4px 12px rgba(0,0,0,0.2)`
              : isProcessing
                ? undefined
                : `0 0 30px rgba(45, 212, 191, 0.4), inset 0 -4px 12px rgba(0,0,0,0.15)`,
          }}
        >
          {/* Inner highlight */}
          <div className="absolute inset-1 rounded-full bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
          
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1, rotate: 360 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ 
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.2 },
                  rotate: { duration: 1, repeat: Infinity, ease: "linear" }
                }}
              >
                <Loader2 className="w-12 h-12 text-surface-500 dark:text-surface-400" />
              </motion.div>
            ) : isRecording ? (
              <motion.div
                key="stop"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                <Square className="w-10 h-10 text-white fill-current drop-shadow-lg" />
              </motion.div>
            ) : (
              <motion.div
                key="mic"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                <Mic className="w-12 h-12 text-white drop-shadow-lg" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      {/* Label - with status indicator */}
      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="flex items-center justify-center gap-2">
          {isRecording && (
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-red-500"
            />
          )}
          <span className={cn(
            'text-base font-semibold tracking-wide',
            isRecording 
              ? 'text-red-500' 
              : isProcessing
                ? 'text-surface-500 dark:text-surface-400'
                : 'text-primary-600 dark:text-primary-400'
          )}>
            {state === 'requesting'
              ? 'Starting...'
              : state === 'processing'
                ? 'Transcribing...'
                : isRecording
                  ? 'Recording'
                  : 'Click to record'}
          </span>
        </div>
        {!isRecording && !isProcessing && (
          <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">
            Up to 5 minutes
          </p>
        )}
      </motion.div>
    </div>
  );
}

export default RecordingButton;
