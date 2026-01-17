/**
 * Card Component
 * Glass-morphism style card container
 */

import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils';

// ===========================================
// Types
// ===========================================

interface CardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  variant?: 'default' | 'glass' | 'elevated' | 'clean';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
}

// ===========================================
// Styles
// ===========================================

const variantStyles = {
  default: `
    bg-white/90 dark:bg-surface-800/90
    border border-surface-200/50 dark:border-surface-700/50
    backdrop-blur-md
  `,
  glass: `
    bg-white/60 dark:bg-surface-900/50
    backdrop-blur-2xl
    border border-white/40 dark:border-white/10
    shadow-xl shadow-black/5 dark:shadow-black/20
  `,
  elevated: `
    bg-white/80 dark:bg-surface-800/80
    shadow-2xl shadow-black/10
    border border-white/50 dark:border-surface-700/50
    backdrop-blur-xl
  `,
  clean: `
    bg-white/70 dark:bg-surface-900/70
    border border-surface-200/30 dark:border-surface-800/30
    backdrop-blur-lg
  `,
};

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
  xl: 'p-10',
};

// ===========================================
// Component
// ===========================================

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      className,
      ...props
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          'rounded-3xl',
          variantStyles[variant],
          paddingStyles[padding],
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('mb-6', className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn(
      'text-xl font-bold text-surface-900 dark:text-surface-100',
      className
    )}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn(
      'text-base text-surface-500 dark:text-surface-400 mt-2 font-medium',
      className
    )}>
      {children}
    </p>
  );
}

export function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn(className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mt-8 pt-6 border-t border-surface-100 dark:border-surface-700/50', className)}>
      {children}
    </div>
  );
}

export default Card;
