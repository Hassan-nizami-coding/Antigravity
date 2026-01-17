/**
 * Error Message Component
 * Displays errors with retry option
 */

import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RefreshCw, X } from 'lucide-react';
import { Button } from './ui';

// ===========================================
// Types
// ===========================================

interface ErrorMessageProps {
  message: string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}

// ===========================================
// Component
// ===========================================

export function ErrorMessage({
  message,
  onRetry,
  onDismiss,
}: ErrorMessageProps) {
  if (!message) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        className="w-full max-w-md mx-auto mt-6"
      >
        <div className="relative overflow-hidden rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent" />
          
          <div className="relative flex items-start gap-3">
            {/* Icon */}
            <div className="flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-800 dark:text-red-200">
                Something went wrong
              </p>
              <p className="mt-1 text-sm text-red-600 dark:text-red-300">
                {message}
              </p>
              
              {/* Actions */}
              <div className="flex items-center gap-2 mt-3">
                {onRetry && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRetry}
                    leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                    className="text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                  >
                    Try again
                  </Button>
                )}
              </div>
            </div>
            
            {/* Dismiss button */}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <X className="w-4 h-4 text-red-500" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default ErrorMessage;
