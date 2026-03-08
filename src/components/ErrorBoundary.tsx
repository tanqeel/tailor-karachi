import React from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertTriangle size={32} className="text-destructive" />
          </div>
          <h2 className="text-lg font-bold mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground mb-1">کچھ غلط ہو گیا</p>
          <p className="text-xs text-muted-foreground mb-6 max-w-xs">
            {this.state.error?.message || this.props.fallbackMessage || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-semibold flex items-center gap-2 active:scale-95 transition-transform"
          >
            <RotateCcw size={16} /> Try Again / دوبارہ کوشش کریں
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
