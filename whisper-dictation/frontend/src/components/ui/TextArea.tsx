/**
 * TextArea Component
 * Styled textarea with auto-resize option
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { cn } from '../../utils';

// ===========================================
// Types
// ===========================================

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  autoResize?: boolean;
  minHeight?: number;
  maxHeight?: number;
  error?: string;
  label?: string;
}

// ===========================================
// Component
// ===========================================

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      autoResize = false,
      minHeight = 120,
      maxHeight = 400,
      error,
      label,
      className,
      onChange,
      value,
      ...props
    },
    forwardedRef
  ) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const ref = (forwardedRef as React.RefObject<HTMLTextAreaElement>) || internalRef;

    // Auto-resize logic
    const resize = useCallback(() => {
      const textarea = ref.current;
      if (!textarea || !autoResize) return;

      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
    }, [autoResize, minHeight, maxHeight, ref]);

    // Resize on value change
    useEffect(() => {
      resize();
    }, [value, resize]);

    // Handle change
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange?.(e);
      resize();
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          value={value}
          onChange={handleChange}
          style={{ minHeight: `${minHeight}px` }}
          className={cn(
            // Base styles
            'w-full rounded-xl px-4 py-3',
            'text-surface-900 dark:text-surface-100',
            'placeholder-surface-400 dark:placeholder-surface-500',
            'resize-none',
            
            // Background
            'bg-surface-50 dark:bg-surface-900',
            
            // Border
            'border-2',
            error
              ? 'border-red-500 focus:border-red-500'
              : 'border-surface-200 dark:border-surface-700 focus:border-primary-500',
            
            // Focus
            'focus:outline-none focus:ring-2 focus:ring-primary-500/20',
            
            // Transition
            'transition-colors duration-200',
            
            // Font
            'font-sans text-base leading-relaxed',
            
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export default TextArea;
