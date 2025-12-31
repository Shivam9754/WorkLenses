import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen flex items-center justify-center bg-[#030712]">
          <div className="glass p-8 rounded-lg max-w-lg text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">⚠️ System Error</h1>
            <p className="text-gray-300 mb-4">
              WorkLens encountered an unexpected error and needs to restart.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Error: {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-lime-500 text-black font-medium rounded hover:bg-lime-400 transition-colors"
            >
              Restart WorkLens
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
