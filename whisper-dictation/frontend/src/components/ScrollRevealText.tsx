import { motion } from 'framer-motion';

interface ScrollRevealTextProps {
  text: string;
  className?: string;
}

export default function ScrollRevealText({ text, className = '' }: ScrollRevealTextProps) {
  const characters = text.split('');

  return (
    <motion.div
      className={`relative overflow-hidden inline-flex ${className}`}
      style={{ lineHeight: 1.2 }}
      // Variants will be propagated from parent if parent has initial/whileHover
      variants={{
        rest: {},
        hover: {}
      }}
    >
      {characters.map((char, i) => (
        <motion.div
          key={i}
          className="relative flex flex-col items-center"
          variants={{
            rest: { y: 0 },
            hover: { y: '-100%' },
          }}
          transition={{
            duration: 0.4,
            ease: [0.33, 1, 0.68, 1],
            delay: 0.02 * i,
          }}
        >
          {/* Default State */}
          <span className="block h-full text-surface-600 dark:text-surface-300 font-medium group-hover:text-transparent transition-colors duration-300">
            {char === ' ' ? '\u00A0' : char}
          </span>
          
          {/* Hover State (Revealed from bottom) */}
          <span className="block h-full absolute top-full left-0 text-primary-600 dark:text-primary-300 font-bold drop-shadow-md">
            {char === ' ' ? '\u00A0' : char}
          </span>
        </motion.div>
      ))}
    </motion.div>
  );
}
