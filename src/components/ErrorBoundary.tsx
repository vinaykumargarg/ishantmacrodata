import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Auto-heal dynamically imported module failures seamlessly without user disruption
    const isChunkError =
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed') ||
      error?.message?.includes('dynamically imported');

    if (isChunkError && typeof window !== 'undefined') {
      const reloadKey = 'chunk_reload_attempts';
      const attempts = parseInt(sessionStorage.getItem(reloadKey) || '0', 10);
      if (attempts < 2) {
        sessionStorage.setItem(reloadKey, String(attempts + 1));
        window.location.reload();
      }
    }
  }

  private handleReload = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      const isChunkError =
        this.state.error?.message?.includes('Failed to fetch dynamically imported module') ||
        this.state.error?.message?.includes('Importing a module script failed') ||
        this.state.error?.message?.includes('dynamically imported');

      if (isChunkError) {
        return (
          <div className="min-h-[420px] w-full flex flex-col items-center justify-center p-6 bg-[#070d1e] border border-blue-500/30 rounded-2xl text-center space-y-4 shadow-2xl my-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-xl animate-spin text-blue-400">
              ⚡
            </div>
            <div className="space-y-1.5 max-w-lg">
              <h3 className="text-sm font-bold text-white">
                Syncing Latest Terminal Assets...
              </h3>
              <p className="text-xs text-slate-400">
                Fresh platform updates deployed. Automatically updating workspace view...
              </p>
            </div>
          </div>
        );
      }

      return (
        <div className="min-h-[420px] w-full flex flex-col items-center justify-center p-6 bg-[#070d1e] border border-rose-500/30 rounded-2xl text-center space-y-4 shadow-2xl my-4">
          <div className="h-16 w-16 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-3xl animate-pulse">
            ⚠️
          </div>
          <div className="space-y-1.5 max-w-lg">
            <h3 className="text-lg font-black text-white">
              {this.props.fallbackTitle || 'Component Temporary Loading Anomaly'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Yeh section render hone mein temporary issue aaya hai. Data safely preserved hai aur koi capital ya trade impact nahi hua hai.
            </p>
            {this.state.error?.message && (
              <p className="text-[11px] font-mono text-rose-300 bg-rose-950/40 border border-rose-500/20 p-2 rounded-lg break-all">
                {this.state.error.message}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={this.handleReload}
              className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all shadow-lg cursor-pointer"
            >
              🔄 Reload This View
            </button>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.hash = 'market-chart-analyse';
                  window.location.reload();
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
            >
              🔬 Open Market Chart Analyzer
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
