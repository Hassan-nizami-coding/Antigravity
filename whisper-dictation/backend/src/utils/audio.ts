/**
 * Audio Processing Utilities
 * Handles audio format validation and normalization
 */

import type { AudioFormat } from '../types/index.js';
import { audioLogger as logger } from './logger.js';

// ===========================================
// Supported Formats Configuration
// ===========================================

export const SUPPORTED_AUDIO_FORMATS: readonly AudioFormat[] = [
  'flac',
  'mp3',
  'mp4',
  'mpeg',
  'mpga',
  'ogg',
  'wav',
  'webm',
] as const;

export const MIME_TYPE_MAP: Record<string, AudioFormat> = {
  'audio/flac': 'flac',
  'audio/x-flac': 'flac',
  'audio/mp3': 'mp3',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'mp4',
  'audio/m4a': 'mp4',
  'audio/x-m4a': 'mp4',
  'audio/ogg': 'ogg',
  'audio/vorbis': 'ogg',
  'audio/wav': 'wav',
  'audio/wave': 'wav',
  'audio/x-wav': 'wav',
  'audio/webm': 'webm',
  'video/webm': 'webm', // WebM can be video container with audio
};

// File extension to format mapping
export const EXTENSION_MAP: Record<string, AudioFormat> = {
  '.flac': 'flac',
  '.mp3': 'mp3',
  '.mp4': 'mp4',
  '.m4a': 'mp4',
  '.mpeg': 'mpeg',
  '.mpga': 'mpga',
  '.ogg': 'ogg',
  '.oga': 'ogg',
  '.opus': 'ogg',
  '.wav': 'wav',
  '.wave': 'wav',
  '.webm': 'webm',
};

// ===========================================
// Audio Validation Functions
// ===========================================

/**
 * Validate and extract audio format from MIME type
 */
export function getFormatFromMimeType(mimeType: string): AudioFormat | null {
  const normalizedMime = mimeType.toLowerCase().split(';')[0]?.trim();
  if (!normalizedMime) return null;
  return MIME_TYPE_MAP[normalizedMime] ?? null;
}

/**
 * Validate and extract audio format from filename
 */
export function getFormatFromFilename(filename: string): AudioFormat | null {
  const extension = filename.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!extension) return null;
  return EXTENSION_MAP[extension] ?? null;
}

/**
 * Determine audio format from MIME type or filename
 */
export function detectAudioFormat(
  mimeType: string,
  filename: string
): AudioFormat | null {
  // Try MIME type first (more reliable)
  let format = getFormatFromMimeType(mimeType);
  
  if (!format) {
    // Fall back to filename extension
    format = getFormatFromFilename(filename);
    logger.debug({ mimeType, filename, detectedFormat: format }, 'Format detected from filename');
  }
  
  return format;
}

/**
 * Check if a format is supported
 */
export function isFormatSupported(format: string): format is AudioFormat {
  return SUPPORTED_AUDIO_FORMATS.includes(format as AudioFormat);
}

/**
 * Validate audio file for transcription
 */
export interface AudioValidationResult {
  valid: boolean;
  format?: AudioFormat;
  error?: string;
}

export function validateAudioFile(
  buffer: Buffer,
  mimeType: string,
  filename: string,
  maxSizeBytes: number
): AudioValidationResult {
  // Check file size
  if (buffer.length === 0) {
    return { valid: false, error: 'Audio file is empty' };
  }
  
  if (buffer.length > maxSizeBytes) {
    return { 
      valid: false, 
      error: `File size ${(buffer.length / 1024 / 1024).toFixed(2)}MB exceeds maximum ${(maxSizeBytes / 1024 / 1024).toFixed(2)}MB` 
    };
  }
  
  // Detect and validate format
  const format = detectAudioFormat(mimeType, filename);
  
  if (!format) {
    return { 
      valid: false, 
      error: `Unsupported audio format. Supported formats: ${SUPPORTED_AUDIO_FORMATS.join(', ')}` 
    };
  }
  
  logger.info({ 
    format, 
    sizeBytes: buffer.length, 
    filename 
  }, 'Audio file validated successfully');
  
  return { valid: true, format };
}

/**
 * Get proper filename with correct extension for a format
 */
export function normalizeFilename(filename: string, format: AudioFormat): string {
  const baseName = filename.replace(/\.[^.]+$/, '');
  const extension = format === 'mpeg' ? 'mp3' : format;
  return `${baseName}.${extension}`;
}

/**
 * Get MIME type for a format
 */
export function getMimeTypeForFormat(format: AudioFormat): string {
  const mimeTypes: Record<AudioFormat, string> = {
    flac: 'audio/flac',
    mp3: 'audio/mpeg',
    mp4: 'audio/mp4',
    mpeg: 'audio/mpeg',
    mpga: 'audio/mpeg',
    ogg: 'audio/ogg',
    wav: 'audio/wav',
    webm: 'audio/webm',
  };
  return mimeTypes[format];
}
