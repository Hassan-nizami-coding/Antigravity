/**
 * Application Logger
 * Structured logging with Pino for high performance
 */

import pino from 'pino';
import { config, isDevelopment } from '../config/index.js';

// ===========================================
// Logger Configuration
// ===========================================

const loggerOptions: pino.LoggerOptions = {
  level: config.logLevel,
  
  // Base context added to all logs
  base: {
    service: 'whisper-dictation-api',
    env: config.nodeEnv,
  },
  
  // Timestamp formatting
  timestamp: pino.stdTimeFunctions.isoTime,
  
  // Redact sensitive information
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      'apiKey',
      'password',
      'secret',
      'token',
    ],
    censor: '[REDACTED]',
  },
};

// Pretty printing for development
const developmentTransport = {
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'SYS:standard',
    ignore: 'pid,hostname',
    singleLine: false,
  },
};

// ===========================================
// Create Logger Instance
// ===========================================

export const logger = isDevelopment
  ? pino(loggerOptions, pino.transport(developmentTransport))
  : pino(loggerOptions);

// ===========================================
// Child Loggers for Different Modules
// ===========================================

export function createChildLogger(module: string) {
  return logger.child({ module });
}

// Pre-created child loggers for common modules
export const httpLogger = createChildLogger('http');
export const transcriptionLogger = createChildLogger('transcription');
export const audioLogger = createChildLogger('audio');

export default logger;
