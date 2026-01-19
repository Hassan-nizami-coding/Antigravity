/**
 * Button Component
 * Reusable button with variants and sizes
 */

import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils';

// ===========================================
// Types
// ===========================================

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'turquoise';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

// ===========================================
// Styles
// ===========================================

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    bg-surface-900 text-white
    hover:bg-surface-800
    active:bg-black
    dark:bg-surface-100 dark:text-surface-900
    dark:hover:bg-surface-200
    shadow-lg hover:shadow-xl
  `,
  turquoise: `
    bg-gradient-to-r from-primary-400 to-primary-500 text-white
    hover:from-primary-500 hover:to-primary-600
    shadow-glow hover:shadow-glow-lg
    border border-primary-400/20
  `,
  secondary: `
    bg-white text-surface-700
    hover:bg-surface-50
    active:bg-surface-100
    border border-surface-200
    dark:bg-surface-800 dark:text-surface-200
    dark:border-surface-700 dark:hover:bg-surface-700
    shadow-sm hover:shadow-md
  `,
  ghost: `
    bg-transparent text-surface-600
    hover:bg-surface-100
    active:bg-surface-200
    dark:text-surface-400 dark:hover:bg-surface-800/50
  `,
  danger: `
    bg-red-50 text-red-600
    hover:bg-red-100
    border border-red-100
    dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/30
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-xs font-semibold gap-2 rounded-lg',
  md: 'px-5 py-2.5 text-sm font-semibold gap-2.5 rounded-xl',
  lg: 'px-8 py-3.5 text-base font-bold gap-3 rounded-2xl',
  xl: 'px-10 py-4 text-lg font-bold gap-3 rounded-2xl',
};

// ===========================================
// Component
// ===========================================

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        disabled={disabled || isLoading}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center',
          'transition-all duration-200',
          'focus:outline-none focus:ring-4 focus:ring-primary-500/20',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
          // Variant and size
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <LoadingSpinner size={size} />
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

// ===========================================
// Loading Spinner
// ===========================================

function LoadingSpinner({ size }: { size: ButtonSize }) {
  const spinnerSize = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };

  return (
    <svg
      className={cn('animate-spin', spinnerSize[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default Button;
