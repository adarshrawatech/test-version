import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      let errorMessage = "An unexpected error occurred in the protocol.";
      let isFirestoreError = false;

      try {
        if (this.state.error?.message) {
          const parsed = JSON.parse(this.state.error.message);
          if (parsed.error && parsed.operationType) {
            errorMessage = `Protocol Error: ${parsed.error} during ${parsed.operationType} on ${parsed.path}`;
            isFirestoreError = true;
          }
        }
      } catch (e) {
        // Not a JSON error message
      }

      return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-neutral-900 border border-red-500/30 rounded-3xl p-8 shadow-2xl text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
            
            <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-black tracking-tighter text-red-500 uppercase italic mb-2">System Breach</h1>
            <p className="text-neutral-400 font-mono text-[10px] uppercase tracking-widest mb-8">Error Code: {isFirestoreError ? 'FIRESTORE_AUTH_FAILURE' : 'RUNTIME_EXCEPTION'}</p>
            
            <div className="bg-neutral-950 p-4 rounded-2xl border border-neutral-800 mb-8 text-left">
              <p className="text-xs text-neutral-300 font-mono break-words">
                {errorMessage}
              </p>
            </div>

            <button 
              onClick={this.handleReset}
              className="w-full bg-neutral-100 hover:bg-white text-neutral-950 font-black py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3 uppercase italic tracking-tighter"
            >
              <RefreshCw className="w-5 h-5" />
              Reboot System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
