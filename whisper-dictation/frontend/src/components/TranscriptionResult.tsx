/**
 * Transcription Result Component
 * Displays and allows editing of transcription results with premium styling
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, Download, RotateCcw, Clock, Globe, Hash, FileText, Sparkles } from 'lucide-react';
import { Card, CardContent, TextArea, Button } from './ui';
import type { TranscriptionResult } from '../types';
import { cn, copyToClipboard, downloadAsFile, formatDuration } from '../utils';

// ===========================================
// Types
// ===========================================

interface TranscriptionResultProps {
  result: TranscriptionResult | null;
  onReset: () => void;
  isVisible: boolean;
}

// ===========================================
// Component
// ===========================================

export function TranscriptionResultComponent({
  result,
  onReset,
  isVisible,
}: TranscriptionResultProps) {
  const [text, setText] = useState(result?.text ?? '');
  const [copied, setCopied] = useState(false);

  // Update text when result changes
  React.useEffect(() => {
    if (result?.text) {
      setText(result.text);
    }
  }, [result?.text]);

  // Handle copy
  const handleCopy = async () => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Handle download
  const handleDownload = () => {
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
    downloadAsFile(text, `transcription-${timestamp}.txt`, 'text/plain');
  };

  if (!result) return null;

  const wordCount = text.split(/\s+/).filter(Boolean).length;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="w-full max-w-2xl mx-auto mt-10"
        >
          <div className="relative">
            {/* Success indicator bar */}
            <div className="absolute -top-1 left-6 right-6 h-1 bg-gradient-to-r from-primary-400 via-cyan-400 to-primary-400 rounded-full opacity-80" />
            
            <Card variant="glass" padding="none" className="overflow-hidden">
              <CardContent>
                {/* Header */}
                <div className="px-8 pt-8 pb-6 border-b border-surface-200/50 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 shadow-lg shadow-primary-500/20">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-surface-900 dark:text-white">
                          Transcription Complete
                        </h3>
                        <p className="text-sm text-surface-500 dark:text-surface-400">
                          Edit your text below
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onReset}
                      leftIcon={<RotateCcw className="w-4 h-4" />}
                      className="text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                    >
                      New Recording
                    </Button>
                  </div>
                </div>

                {/* Editable Text Area */}
                <div className="p-8">
                  <TextArea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    autoResize
                    minHeight={150}
                    maxHeight={400}
                    className="font-sans text-base leading-relaxed"
                    placeholder="Transcription will appear here..."
                  />

                  {/* Metadata Pills */}
                  <div className="flex flex-wrap gap-3 mt-6">
                    {result.language && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-100/80 dark:bg-surface-800/80 text-sm text-surface-600 dark:text-surface-300">
                        <Globe className="w-4 h-4 text-primary-500" />
                        <span className="capitalize font-medium">{result.language}</span>
                      </div>
                    )}
                    {result.audioDurationSeconds !== undefined && (
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-100/80 dark:bg-surface-800/80 text-sm text-surface-600 dark:text-surface-300">
                        <Clock className="w-4 h-4 text-primary-500" />
                        <span className="font-medium">{formatDuration(result.audioDurationSeconds)}</span>
                      </div>
                    )}
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-100/80 dark:bg-surface-800/80 text-sm text-surface-600 dark:text-surface-300">
                      <Hash className="w-4 h-4 text-primary-500" />
                      <span className="font-medium">{wordCount} words</span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-100/80 dark:bg-surface-800/80 text-sm text-surface-600 dark:text-surface-300">
                      <FileText className="w-4 h-4 text-primary-500" />
                      <span className="font-medium">{text.length} chars</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 mt-8">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant={copied ? "turquoise" : "secondary"}
                        onClick={handleCopy}
                        leftIcon={
                          copied ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )
                        }
                        className={cn(
                          "transition-all duration-300",
                          copied && 'shadow-lg shadow-primary-500/30'
                        )}
                      >
                        {copied ? 'Copied!' : 'Copy to Clipboard'}
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        variant="secondary"
                        onClick={handleDownload}
                        leftIcon={<Download className="w-4 h-4" />}
                      >
                        Download .txt
                      </Button>
                    </motion.div>
                  </div>
                </div>

                {/* Footer with processing info */}
                <div className="px-8 py-4 bg-surface-50/50 dark:bg-surface-900/50 border-t border-surface-200/30 dark:border-white/5">
                  <div className="flex items-center justify-between text-xs text-surface-400 dark:text-surface-500">
                    <span>Processed in {result.processingTimeMs}ms</span>
                    <span className="font-mono">ID: {result.requestId.slice(0, 12)}...</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default TranscriptionResultComponent;
