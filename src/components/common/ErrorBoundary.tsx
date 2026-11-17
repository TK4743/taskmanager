import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { ErrorBoundaryProps, ErrorBoundaryState } from '../../types';

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false, error: null };
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary captured runtime error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 my-8 bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-3xl text-center max-w-lg mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
            {this.props.fallbackTitle || 'Section Display Recovered'}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 max-w-md mx-auto leading-relaxed">
            {this.state.error?.message || 'An unexpected rendering error was handled gracefully. Please try reloading or navigate back to the dashboard.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => (this as any).setState({ hasError: false, error: null })}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50 cursor-pointer shadow-2xs"
            >
              Retry View
            </button>
            <button
              type="button"
              onClick={() => {
                (this as any).setState({ hasError: false, error: null });
                window.location.href = '/dashboard';
              }}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-black text-white hover:bg-zinc-800 cursor-pointer shadow-xs"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
