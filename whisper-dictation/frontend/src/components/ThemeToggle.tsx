/**
 * Theme Toggle Component
 * Dark/Light mode switch with smooth animations
 */

import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks';
import { cn } from '../utils';

// ===========================================
// Component
// ===========================================

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <motion.button
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        'relative p-2.5 rounded-xl',
        'bg-white/40 dark:bg-white/10',
        'backdrop-blur-md',
        'border border-white/30 dark:border-white/10',
        'hover:bg-white/60 dark:hover:bg-white/20',
        'shadow-lg shadow-black/5',
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-primary-500'
      )}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <motion.div
        initial={false}
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {isDark ? (
          <Moon className="w-5 h-5 text-surface-300" />
        ) : (
          <Sun className="w-5 h-5 text-yellow-500" />
        )}
      </motion.div>
    </motion.button>
  );
}

export default ThemeToggle;
