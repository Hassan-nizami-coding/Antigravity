/**
 * Application Configuration
 * Centralized, type-safe configuration management
 * All sensitive values are loaded from environment variables
 */

import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// ===========================================
// Configuration Schema
// ===========================================

const configSchema = z.object({
  // Server
  nodeEnv: z.enum(['development', 'production', 'test']).default('development'),
  port: z.coerce.number().int().positive().default(3001),
  host: z.string().default('0.0.0.0'),
  
  // CORS
  allowedOrigins: z.string().transform((val) => 
    val.split(',').map((origin) => origin.trim()).filter(Boolean)
  ).default('http://localhost:5173'),
  
  // Groq API
  groqApiKey: z.string().min(1, 'GROQ_API_KEY is required'),
  groqApiUrl: z.string().url().default('https://api.groq.com/openai/v1/audio/transcriptions'),
  
  // Rate Limiting
  rateLimitWindowMs: z.coerce.number().int().positive().default(60000),
  rateLimitMaxRequests: z.coerce.number().int().positive().default(30),
  
  // Audio Processing
  maxAudioSizeMb: z.coerce.number().positive().default(25),
  audioTimeoutMs: z.coerce.number().int().positive().default(60000),
  
  // Logging
  logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

type Config = z.infer<typeof configSchema>;

// ===========================================
// Configuration Loader
// ===========================================

function loadConfig(): Config {
  const rawConfig = {
    nodeEnv: process.env['NODE_ENV'],
    port: process.env['PORT'],
    host: process.env['HOST'],
    allowedOrigins: process.env['ALLOWED_ORIGINS'],
    groqApiKey: process.env['GROQ_API_KEY'],
    groqApiUrl: process.env['GROQ_API_URL'],
    rateLimitWindowMs: process.env['RATE_LIMIT_WINDOW_MS'],
    rateLimitMaxRequests: process.env['RATE_LIMIT_MAX_REQUESTS'],
    maxAudioSizeMb: process.env['MAX_AUDIO_SIZE_MB'],
    audioTimeoutMs: process.env['AUDIO_TIMEOUT_MS'],
    logLevel: process.env['LOG_LEVEL'],
  };

  const result = configSchema.safeParse(rawConfig);
  
  if (!result.success) {
    console.error('❌ Configuration validation failed:');
    result.error.issues.forEach((issue) => {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    });
    process.exit(1);
  }

  return result.data;
}

// ===========================================
// Exported Configuration
// ===========================================

export const config = loadConfig();

// Derived configurations
export const isProduction = config.nodeEnv === 'production';
export const isDevelopment = config.nodeEnv === 'development';

// Security: Mask API key for logging
export function getMaskedApiKey(): string {
  const key = config.groqApiKey;
  if (key.length <= 8) return '****';
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

export default config;
