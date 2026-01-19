import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component that catches React component errors
 * and displays a friendly error UI instead of crashing the app
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Update state with error details
    this.setState({
      error,
      errorInfo
    });

    // You can also log the error to an error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  handleReset = (): void => {
    // Reset error boundary state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = (): void => {
    // Reload the entire page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Get theme from body class (set by App component)
      const isDarkMode = document.body.classList.contains('dark-mode');

      return (
        <div className={`min-h-screen flex items-center justify-center p-6 ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
          <div className={`premium-glass rounded-[48px] p-12 max-w-2xl w-full border shadow-2xl ${isDarkMode ? 'border-white/10' : 'border-white/40'}`}>
            {/* Error Icon */}
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 rounded-[24px] bg-rose-500/10 border-2 border-rose-500/20 flex items-center justify-center">
                <AlertTriangle className="w-10 h-10 text-rose-500" />
              </div>
            </div>

            {/* Error Title */}
            <h1 className={`text-3xl font-black tracking-tighter uppercase text-center mb-4 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              System Error
            </h1>

            <div className="w-16 h-1 bg-rose-500 mx-auto rounded-full mb-8"></div>

            {/* Error Message */}
            <p className={`text-center mb-8 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Something went wrong while rendering the application. This error has been logged for debugging.
            </p>

            {/* Error Details (Development) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className={`p-6 rounded-[24px] border mb-8 ${isDarkMode ? 'bg-slate-900/50 border-white/5' : 'bg-slate-100 border-slate-200'}`}>
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-3">Error Details</p>
                <p className={`font-mono text-xs mb-2 ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-4">
                    <summary className={`text-xs font-bold cursor-pointer ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Component Stack
                    </summary>
                    <pre className={`mt-2 text-[10px] overflow-auto max-h-40 ${isDarkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={this.handleReset}
                className={`flex items-center justify-center gap-3 px-8 py-5 rounded-[24px] font-black uppercase text-xs tracking-[0.2em] transition-all transform hover:scale-[1.02] ${
                  isDarkMode
                    ? 'bg-white/5 border-2 border-white/10 text-white hover:bg-white/10'
                    : 'bg-white border-2 border-slate-200 text-slate-900 hover:border-slate-300'
                }`}
              >
                <Home className="w-5 h-5" />
                <span>Try Again</span>
              </button>

              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-3 px-8 py-5 rounded-[24px] bg-rose-600 hover:bg-rose-500 transition-all transform hover:scale-[1.02] text-white font-black uppercase text-xs tracking-[0.2em] shadow-xl shadow-rose-500/20"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Reload Page</span>
              </button>
            </div>

            {/* Help Text */}
            <p className={`text-center mt-8 text-xs ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>
              If this error persists, try clearing your browser cache or contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
