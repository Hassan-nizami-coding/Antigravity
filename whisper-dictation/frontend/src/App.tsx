/**
 * Main Application Component
 * Whisper Dictation - Speech to Text
 */

import React, { useState, useCallback, useEffect, Suspense, lazy, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mic, Sparkles, Shield, Zap, Waves, Star } from 'lucide-react';
import {
  RecordingButton,
  ThemeToggle,
  ErrorMessage,
} from './components';

// Lazy load heavy components
const AudioVisualizer = lazy(() => import('./components/AudioVisualizer'));
const TranscriptionResultComponent = lazy(() => import('./components/TranscriptionResult'));
const DarkVeil = lazy(() => import('./components/DarkVeil'));
const Iridescence = lazy(() => import('./components/Iridescence'));

import RotatingText from './components/RotatingText';
import ScrollRevealText from './components/ScrollRevealText';
import { useAudioRecorder, useTheme } from './hooks';
import { transcriptionApi, ApiError } from './services/api';
import type { TranscriptionResult, RecordingState } from './types';

// ===========================================
// Floating Particle Component
// ===========================================

function FloatingParticles({ count = 20, isDark }: { count?: number; isDark: boolean }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 15,
    delay: Math.random() * 5,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[2]">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className={`absolute rounded-full ${
            isDark 
              ? 'bg-primary-400/20' 
              : 'bg-primary-500/15'
          }`}
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            delay: particle.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ===========================================
// App Component
// ===========================================

export function App() {
  // Theme
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Recording state
  const {
    state: recorderState,
    duration,
    audioLevel,
    audioBlob,
    error: recorderError,
    startRecording,
    stopRecording,
    reset: resetRecorder,
    isSupported,
  } = useAudioRecorder({ maxDuration: 300 });

  // App state
  const [appState, setAppState] = useState<RecordingState>('idle');
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Ref to track if we've already started transcription for current blob
  const processingBlobRef = useRef<Blob | null>(null);

  // Keep track of latest duration in a ref to avoid stale closures in callbacks
  const durationRef = useRef(duration);
  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  // Sync recorder state with app state
  useEffect(() => {
    if (recorderState === 'recording') {
      setAppState('recording');
    } else if (recorderState === 'requesting') {
      setAppState('requesting');
    } else if (recorderState === 'error') {
      setAppState('error');
      setError(recorderError);
    }
  }, [recorderState, recorderError]);

  // Handle transcription when recording stops - using ref to avoid dependency issues
  useEffect(() => {
    if (audioBlob && audioBlob !== processingBlobRef.current && appState === 'recording') {
      processingBlobRef.current = audioBlob;
      handleTranscribe(audioBlob);
    }
  }, [audioBlob, appState]);

  // Transcribe audio
  const handleTranscribe = useCallback(async (blob: Blob) => {
    // Validate recording length/size
    const currentDuration = durationRef.current;
    
    if (blob.size < 1024 || currentDuration < 0.5) {
      console.warn('Recording too short:', blob.size, currentDuration);
      setError('Recording too short. Please speak for at least 0.5 seconds.');
      setAppState('error');
      return;
    }

    setAppState('processing');
    setError(null);

    try {
      const result = await transcriptionApi.transcribe(blob);
      setTranscription(result);
      setAppState('complete');
    } catch (err) {
      console.error('Transcription failed:', err);
      
      let errorMessage = 'Failed to transcribe audio. Please try again.';
      
      if (err instanceof ApiError) {
        if (err.isRateLimited) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (err.isServerError) {
          errorMessage = 'Server error. The transcription service may be temporarily unavailable.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
      setAppState('error');
    }
  }, []);

  // Start recording handler
  const handleStart = useCallback(() => {
    setError(null);
    setTranscription(null);
    processingBlobRef.current = null;
    startRecording();
  }, [startRecording]);

  // Stop recording handler
  const handleStop = useCallback(() => {
    stopRecording();
  }, [stopRecording]);

  // Reset everything
  const handleReset = useCallback(() => {
    resetRecorder();
    setTranscription(null);
    setError(null);
    setAppState('idle');
    processingBlobRef.current = null;
  }, [resetRecorder]);

  // Dismiss error
  const handleDismissError = useCallback(() => {
    setError(null);
    if (appState === 'error') {
      setAppState('idle');
    }
  }, [appState]);

  // Show result section
  const showResult = appState === 'complete' && transcription;

  return (
    <>
      {/* ============================================
          LAYER 0: Background (DarkVeil or Iridescence)
          ============================================ */}
      <Suspense fallback={<div className="fixed inset-0 bg-surface-50 dark:bg-surface-950" />}>
        {isDark ? (
          <>
            {/* Deep Purple Gradient Background for Dark Mode */}
            <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary-900/30 via-surface-950 to-surface-950 z-0" />
            <DarkVeil
              hueShift={0}
              noiseIntensity={0.12}
              scanlineIntensity={0.15}
              scanlineFrequency={500}
              warpAmount={0.4}
              speed={0.25}
              className="opacity-50 transition-opacity duration-1000 z-0"
              resolutionScale={0.5}
            />
          </>
        ) : (
          <Iridescence
            color={[1, 1, 1]}
            speed={1.0}
            amplitude={0.15}
            mouseReact={true}
            className="opacity-100 transition-opacity duration-1000 fixed inset-0 z-0"
          />
        )}
      </Suspense>

      {/* Floating particles */}
      <FloatingParticles isDark={isDark} count={15} />

      {/* ============================================
          LAYER 1: Overlay for readability
          ============================================ */}
      <div 
        className={`fixed inset-0 z-[1] pointer-events-none transition-colors duration-700 ${
          isDark 
            ? 'bg-gradient-to-b from-primary-950/20 via-transparent to-surface-950/70' 
            : 'bg-gradient-to-b from-white/10 via-white/0 to-white/30'
        }`}
      />

      {/* ============================================
          LAYER 2: Content
          ============================================ */}
      <div className="min-h-screen relative overflow-hidden z-10">
        {/* Header - Enhanced Glassmorphism */}
        <header className="sticky top-0 z-50 px-6 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="relative rounded-2xl backdrop-blur-2xl bg-white/70 dark:bg-surface-900/60 border border-white/50 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-black/20 px-6 py-4">
              {/* Animated gradient border */}
              <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-r from-primary-400/50 via-transparent to-primary-400/50 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="flex items-center justify-between relative">
                <div className="flex items-center gap-4">
                  {/* Logo container with premium glass effect */}
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
                    <div className="relative p-3.5 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl shadow-lg shadow-primary-500/30">
                      <Mic className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-surface-900 to-surface-700 dark:from-white dark:to-surface-300 bg-clip-text text-transparent">
                      Whisper Dictation
                    </h1>
                    <p className="text-xs font-medium tracking-widest text-primary-600 dark:text-primary-400 uppercase flex items-center gap-1.5">
                      <Waves className="w-3 h-3" />
                      Powered by Whisper V3
                    </p>
                  </div>
                </div>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-6 py-12 flex flex-col justify-center min-h-[calc(100vh-200px)]">
          <div className="max-w-4xl mx-auto w-full">
            {/* Hero Section - Enhanced */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100/80 dark:bg-primary-900/40 border border-primary-200/50 dark:border-primary-700/30 backdrop-blur-sm mb-8"
              >
                <Star className="w-4 h-4 text-primary-600 dark:text-primary-400 fill-current" />
                <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                  AI-Powered Transcription
                </span>
              </motion.div>

              <h2 className="text-5xl md:text-7xl font-extrabold text-surface-900 dark:text-white mb-6 tracking-tight leading-[1.1] flex flex-col md:block items-center justify-center">
                <span className="font-['Dancing_Script'] bg-gradient-to-r from-primary-600 via-primary-400 to-primary-600 bg-[length:200%_auto] animate-shine bg-clip-text text-transparent pr-2 pb-2 inline-block drop-shadow-sm">
                  Speak freely.
                </span>
                <span className="inline-flex h-[1.2em] overflow-hidden align-bottom justify-center px-2 pb-1 relative">
                  <RotatingText
                    texts={['Dictate flawlessly.', 'Transcribe instantly.', 'Capture thoughts.']}
                    mainClassName="text-primary-600 dark:text-primary-400"
                    staggerFrom="last"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "-120%" }}
                    staggerDuration={0.025}
                    splitLevelClassName="overflow-hidden pb-1"
                    transition={{ type: "spring", damping: 30, stiffness: 400 }}
                    rotationInterval={3500}
                  />
                </span>
              </h2>
              <p className="text-xl md:text-2xl text-surface-600 dark:text-surface-300 max-w-2xl mx-auto font-light leading-relaxed">
                Experience the clarity of next-gen AI transcription. 
                <br className="hidden md:block"/>
                <span className="text-primary-600 dark:text-primary-400 font-medium">Fast</span>, <span className="text-primary-600 dark:text-primary-400 font-medium">secure</span>, and <span className="text-primary-600 dark:text-primary-400 font-medium">beautiful</span>.
              </p>
            </motion.div>

            {/* Browser Support Warning */}
            {!isSupported && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-md mx-auto mb-8 p-4 backdrop-blur-xl bg-yellow-50/80 dark:bg-yellow-900/40 border border-yellow-300/50 dark:border-yellow-700/50 rounded-2xl shadow-lg"
              >
                <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
                  Audio recording is not supported in your browser. 
                  Please use a modern browser like Chrome, Firefox, or Safari.
                </p>
              </motion.div>
            )}

            {/* Recording Section - Enhanced floating button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="flex flex-col items-center"
            >
              {/* Recording Button with enhanced glow */}
              <div className="relative mb-8">
                {/* Ambient glow behind button */}
                <div className={`absolute inset-0 rounded-full blur-3xl transition-all duration-500 ${
                  appState === 'recording' 
                    ? 'bg-red-500/30 scale-150' 
                    : appState === 'idle' 
                      ? 'bg-primary-500/20 scale-125 opacity-75' 
                      : 'bg-surface-500/10'
                }`} />
                <RecordingButton
                  state={appState}
                  audioLevel={audioLevel}
                  onStart={handleStart}
                  onStop={handleStop}
                  disabled={!isSupported}
                />
              </div>

              {/* Audio Visualizer */}
              <div className="w-full max-w-md h-24">
                 <Suspense fallback={null}>
                  <AudioVisualizer
                    isRecording={appState === 'recording'}
                    duration={duration}
                    audioLevel={audioLevel}
                  />
                </Suspense>
              </div>
            </motion.div>

            {/* Error Message */}
            <ErrorMessage
              message={error}
              onRetry={handleReset}
              onDismiss={handleDismissError}
            />

            {/* Transcription Result with glassmorphism */}
            <Suspense fallback={null}>
              <TranscriptionResultComponent
                result={transcription}
                onReset={handleReset}
                isVisible={!!showResult}
              />
            </Suspense>

            {/* Features Section - Enhanced Cards */}
            {appState === 'idle' && !transcription && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                <FeatureCard
                  icon={<Zap className="w-6 h-6" />}
                  title="Instant & Fast"
                  description="Optimized for speed. Get your words on screen in seconds."
                  gradient="from-amber-400 to-orange-500"
                />
                <FeatureCard
                  icon={<Sparkles className="w-6 h-6" />}
                  title="Whisper Precision"
                  description="Powered by the industry-leading Whisper V3 model."
                  gradient="from-primary-400 to-cyan-500"
                />
                <FeatureCard
                  icon={<Shield className="w-6 h-6" />}
                  title="Secure & Private"
                  description="Your voice data is processed securely and never retained."
                  gradient="from-violet-400 to-purple-500"
                />
              </motion.div>
            )}
          </div>
        </main>

        {/* Footer - Enhanced */}
        <footer className="px-6 py-10">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-medium text-surface-600 dark:text-surface-400">
                  All systems operational
                </span>
              </div>
              <p className="text-sm font-medium text-surface-500 dark:text-surface-500">
                Designed for productivity. Powered by <span className="text-primary-600 dark:text-primary-400">Groq</span>.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

// ===========================================
// Feature Card Component - Enhanced
// ===========================================

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient?: string;
}

function FeatureCard({ icon, title, description, gradient = "from-primary-400 to-primary-600" }: FeatureCardProps) {
  return (
    <motion.div
      initial="rest"
      whileHover="hover"
      animate="rest"
      variants={{
        rest: { y: 0, scale: 1 },
        hover: { y: -8, scale: 1.02 }
      }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className="group relative overflow-hidden p-8 rounded-3xl cursor-pointer transition-all duration-500
        /* Default: Ghost/Grayscale appearance */
        bg-white/50 dark:bg-white/[0.03]
        border border-surface-200/60 dark:border-white/5
        backdrop-blur-xl
        
        /* Hover: Glass + Color */
        hover:bg-white/70 dark:hover:bg-white/10
        hover:border-transparent dark:hover:border-white/20
        hover:shadow-2xl hover:shadow-black/10 dark:hover:shadow-black/30"
    >
      {/* Animated gradient border on hover */}
      <div className="absolute inset-0 rounded-3xl p-[1px] bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10"
        style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))` }}
      >
        <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${gradient} opacity-20`} />
      </div>

      {/* Glow effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-10 blur-xl`} />
      </div>

      {/* Icon Container - Enhanced with gradient */}
      <div className={`relative w-14 h-14 mb-6 flex items-center justify-center rounded-2xl transition-all duration-500
        /* Default: Gray/muted */
        bg-surface-100/80 dark:bg-white/5
        text-surface-500 dark:text-surface-400
        
        /* Hover: Gradient */
        group-hover:bg-gradient-to-br group-hover:${gradient}
        group-hover:text-white
        group-hover:shadow-lg group-hover:shadow-current/30
        group-hover:scale-110`}
      >
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
        <span className="relative z-10 transition-colors duration-300 group-hover:text-white">
          {icon}
        </span>
      </div>
      
      {/* Title - Scroll Reveal Animation */}
      <h3 className="relative text-lg font-bold mb-3 h-[1.5em] overflow-hidden">
        <ScrollRevealText text={title} />
      </h3>
      
      {/* Description - Faded to Clear */}
      <p className="relative text-sm leading-relaxed transition-colors duration-500
        text-surface-500 dark:text-surface-400
        group-hover:text-surface-700 dark:group-hover:text-surface-200"
      >
        {description}
      </p>
    </motion.div>
  );
}

export default App;
