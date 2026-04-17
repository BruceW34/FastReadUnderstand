import React, { ReactNode, ErrorInfo } from 'react';
import { logError } from '../utils/errorLogger';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ✅ Error Boundary - React 18 uyumlu
 * Tüm child components'taki runtime errors'ı yakalar ve handle eder
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    this.setState({
      error,
      errorInfo,
    });

    // Log to external service (Sentry, LogRocket, etc.)
    logError({
      message: error.toString(),
      stack: error.stack || '',
      componentStack: errorInfo.componentStack,
      level: 'error',
      context: 'React Error Boundary',
    });

    // Optional: log to Firebase Analytics
    if (typeof window !== 'undefined' && (window as any).logEvent) {
      (window as any).logEvent('exception', {
        description: `${error.name}: ${error.message}`,
        fatal: false,
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center min-h-screen bg-red-50 dark:bg-red-950 p-4">
            <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900 rounded-full mb-4">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>

              <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
                Hata Oluştu! 😅
              </h2>

              <p className="text-gray-600 dark:text-gray-400 text-center mb-4">
                Üzgünüz, beklenmeyen bir hata oluştu. Lütfen sayfayı yenile veya ana sayfaya geri dön.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-40">
                  <summary className="cursor-pointer font-bold mb-2">Hata Detayları (Dev Mod)</summary>
                  <pre className="text-xs whitespace-pre-wrap">
                    {this.state.error.toString()}
                    {'\n\n'}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  onClick={this.handleReset}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition"
                >
                  Tekrar Dene
                </button>

                <button
                  onClick={() => (window.location.href = '/')}
                  className="flex-1 px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition"
                >
                  Ana Sayfaya Git
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                Hata code: {this.state.error?.name || 'UNKNOWN'}
              </p>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
