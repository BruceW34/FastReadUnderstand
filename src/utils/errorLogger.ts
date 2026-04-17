/**
 * ✅ GLOBAL ERROR LOGGING SYSTEM
 * Tüm errors, warnings, unhandled rejections'ı logla
 */

export interface ErrorLogEntry {
  message: string;
  stack?: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  context?: string;
  componentStack?: string;
  timestamp?: number;
  userId?: string;
  url?: string;
  userAgent?: string;
}

class ErrorLogger {
  private logs: ErrorLogEntry[] = [];
  private maxLogs = 100; // Memory'de max 100 log tutacak
  private isProduction = import.meta.env.VITE_ENVIRONMENT === 'production';
  private enableErrorLogging = import.meta.env.VITE_ENABLE_ERROR_LOGGING === 'true';

  constructor() {
    this.initializeGlobalErrorHandlers();
  }

  /**
   * ✅ Global error handlers setup
   */
  private initializeGlobalErrorHandlers() {
    if (typeof window === 'undefined') return;

    // 1️⃣ Uncaught exceptions
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        stack: event.error?.stack,
        level: 'error',
        context: 'Uncaught Exception',
        url: window.location.href,
      });
    });

    // 2️⃣ Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        level: 'error',
        context: 'Unhandled Promise Rejection',
        url: window.location.href,
      });
    });

    // 3️⃣ Console errors (dev mode'da catch et)
    if (!this.isProduction) {
      const originalError = console.error;
      console.error = (...args) => {
        originalError.apply(console, args);
        this.logError({
          message: args[0]?.toString?.() || JSON.stringify(args[0]),
          level: 'error',
          context: 'Console Error',
        });
      };
    }
  }

  /**
   * ✅ Error logging method
   */
  logError(entry: ErrorLogEntry) {
    const logEntry: ErrorLogEntry = {
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      ...entry,
    };

    // Add to local log storage
    this.logs.push(logEntry);

    // Limit memory usage
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output (dev mode)
    if (!this.isProduction) {
      console.group(`🔴 ${entry.level.toUpperCase()}: ${entry.message}`);
      console.log('Context:', entry.context);
      console.log('Stack:', entry.stack);
      if (entry.componentStack) {
        console.log('Component Stack:', entry.componentStack);
      }
      console.groupEnd();
    }

    // Send to external service (production)
    if (this.isProduction && this.enableErrorLogging) {
      this.sendToExternalService(logEntry);
    }

    // Save to IndexedDB for offline access
    this.saveToIndexedDB(logEntry);
  }

  /**
   * ✅ Send logs to external error tracking service
   * Sentry, LogRocket, Rollbar, vb. integrate et
   */
  private sendToExternalService(entry: ErrorLogEntry) {
    // Example: Sentry integration
    if ((window as any).Sentry) {
      (window as any).Sentry.captureException(new Error(entry.message), {
        level: entry.level as any,
        contexts: {
          react: {
            componentStack: entry.componentStack,
          },
        },
      });
    }

    // Example: Custom API endpoint
    const endpoint = import.meta.env.VITE_ERROR_LOG_ENDPOINT;
    if (endpoint) {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      }).catch(() => {
        // Silently fail if endpoint unreachable
      });
    }

    // Firebase Analytics event (optional)
    if ((window as any).firebase?.analytics) {
      try {
        (window as any).firebase.analytics().logEvent('error', {
          description: entry.message,
          level: entry.level,
          context: entry.context,
        });
      } catch {
        // Ignore Firebase errors
      }
    }
  }

  /**
   * ✅ Save logs to IndexedDB
   * Offline access ve persistence için
   */
  private async saveToIndexedDB(entry: ErrorLogEntry) {
    if (!('indexedDB' in window)) return;

    try {
      const request = indexedDB.open('FastRead', 1);

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        try {
          const transaction = db.transaction(['errorLogs'], 'readwrite');
          const store = transaction.objectStore('errorLogs');
          store.add(entry);
        } catch {
          // Ignore IndexedDB errors
        }
      };

      request.onerror = () => {
        // Ignore setup errors
      };
    } catch {
      // Ignore all IndexedDB errors
    }
  }

  /**
   * ✅ Get all logged errors
   */
  getLogs(): ErrorLogEntry[] {
    return [...this.logs];
  }

  /**
   * ✅ Clear logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * ✅ Export logs for debugging
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Singleton instance
export const errorLogger = new ErrorLogger();

/**
 * ✅ Convenience function
 */
export function logError(entry: ErrorLogEntry) {
  errorLogger.logError(entry);
}

/**
 * ✅ Try-catch wrapper for async functions
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>,
  context: string = 'Async Operation'
): Promise<T | null> {
  try {
    return await fn();
  } catch (error: any) {
    logError({
      message: error.message || 'Unknown error',
      stack: error.stack,
      level: 'error',
      context,
    });
    return null;
  }
}

/**
 * ✅ Debug helper (console'da error logs'u görmek için örn)
 */
if (!import.meta.env.PROD) {
  (window as any).__FastReadDebug = {
    logs: () => errorLogger.getLogs(),
    export: () => errorLogger.exportLogs(),
    clear: () => errorLogger.clearLogs(),
  };
}
