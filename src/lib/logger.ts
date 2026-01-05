/**
 * Structured logging for signal fetch errors
 * BUG #7 FIX: Adds error visibility and monitoring
 */

export interface SignalFetchError {
  signalId: string;
  sourceName: string;
  error: string;
  timestamp: Date;
  errorType: 'network' | 'parsing' | 'validation' | 'timeout' | 'unknown';
}

const recentErrors: SignalFetchError[] = [];

/**
 * Log a signal fetch error
 */
export function logSignalError(error: SignalFetchError) {
  recentErrors.push(error);

  // Keep only last 50 errors
  if (recentErrors.length > 50) {
    recentErrors.shift();
  }

  // Log to console in development
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.warn(
      `[${error.timestamp.toISOString()}] ${error.sourceName} (${error.signalId}): ${error.error}`
    );
  }

  // Send to monitoring service if available (e.g., Sentry)
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    const globalWindow = window as { Sentry?: { captureException: (error: Error, options: object) => void } };
    if (globalWindow.Sentry) {
      globalWindow.Sentry.captureException(new Error(error.error), {
        tags: {
          signal: error.signalId,
          source: error.sourceName,
          errorType: error.errorType,
        },
        level: 'warning',
      });
    }
  }
}

/**
 * Get recent errors for debugging/monitoring
 */
export function getRecentErrors(): SignalFetchError[] {
  return [...recentErrors];
}

/**
 * Clear error log
 */
export function clearErrorLog() {
  recentErrors.length = 0;
}

/**
 * Get error count for a specific signal
 */
export function getErrorCount(signalId: string): number {
  return recentErrors.filter(e => e.signalId === signalId).length;
}

/**
 * Get error count for a specific source
 */
export function getSourceErrorCount(sourceName: string): number {
  return recentErrors.filter(e => e.sourceName === sourceName).length;
}
