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

export class ErrorBoundary extends React.Component<Props, State> {
  public props: Props;
  public state: State;
  public setState: any;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Serenity App:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    try {
      localStorage.clear();
    } catch (e) {
      // ignore
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#140828] text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-md w-full bg-[#1e1045] border border-purple-500/30 rounded-2xl p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-yellow-400/20 border border-yellow-400/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-400" />
            </div>
            <h1 className="text-xl font-bold font-serif text-white mb-2">
              Serenity Wellness System Notice
            </h1>
            <p className="text-sm text-purple-200/80 mb-6 leading-relaxed">
              An unexpected display interruption occurred. You can reload the application or reset local cache to restore full functionality.
            </p>
            {this.state.error && (
              <div className="bg-black/40 border border-purple-500/20 rounded-xl p-3 mb-6 text-left overflow-auto max-h-32 text-xs font-mono text-purple-300">
                {this.state.error.toString()}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#F0D204] text-[#1e1045] rounded-xl font-bold text-sm shadow hover:bg-yellow-300 transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-900/50 hover:bg-purple-900 text-purple-200 rounded-xl font-medium text-sm border border-purple-500/30 transition cursor-pointer"
              >
                <Home className="w-4 h-4" />
                Clear Cache &amp; Reset
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
