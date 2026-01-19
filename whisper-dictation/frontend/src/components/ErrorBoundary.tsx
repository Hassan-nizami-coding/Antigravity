/**
 * Error Boundary Component
 * Gracefully handles React errors with a beautiful UI
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-50 via-primary-50/20 to-surface-100 dark:from-surface-950 dark:via-surface-900 dark:to-primary-950/20 p-4">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full"
          >
            <div className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-surface-900/80 backdrop-blur-2xl border border-red-200/50 dark:border-red-900/30 shadow-2xl">
              {/* Error header gradient */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-400 via-orange-500 to-red-400" />
              
              <div className="p-8 text-center">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/30 dark:to-orange-900/30 flex items-center justify-center mb-6 shadow-lg"
                >
                  <AlertTriangle className="w-10 h-10 text-red-500 dark:text-red-400" />
                </motion.div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-surface-900 dark:text-white mb-3">
                  Oops! Something went wrong
                </h2>

                {/* Description */}
                <p className="text-surface-600 dark:text-surface-400 mb-6 leading-relaxed">
                  We encountered an unexpected error. Don't worry, your data is safe.
                </p>

                {/* Error details (collapsible) */}
                {this.state.error && (
                  <details className="mb-6 text-left">
                    <summary className="cursor-pointer text-sm text-surface-500 dark:text-surface-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                      View technical details
                    </summary>
                    <pre className="mt-3 p-4 bg-surface-100 dark:bg-surface-800 rounded-xl text-xs text-red-600 dark:text-red-400 overflow-auto max-h-32 font-mono">
                      {this.state.error.message}
                    </pre>
                  </details>
                )}

                {/* Actions */}
                <div className="flex gap-3 justify-center">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={this.handleReset}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-surface-100 dark:bg-surface-800 text-surface-700 dark:text-surface-200 font-semibold hover:bg-surface-200 dark:hover:bg-surface-700 transition-all"
                  >
                    <Home className="w-4 h-4" />
                    Try Again
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={this.handleReload}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold shadow-lg shadow-primary-500/25 hover:shadow-primary-500/40 transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reload Page
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
