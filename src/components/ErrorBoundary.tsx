import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CensusMitra AI UI caught an error:', error, errorInfo);
  }

  public handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-[350px] flex items-center justify-center p-6 bg-slate-50">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-red-200 shadow-xl max-w-lg w-full text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Temporary Interface Error Handled
            </h3>
            <p className="text-xs text-slate-600 mt-2">
              CensusMitra AI active protection prevented an unhandled UI crash. Your saved draft data remains safe.
            </p>
            {this.state.error?.message && (
              <div className="mt-4 p-3 bg-red-50/50 rounded-xl text-left font-mono text-[11px] text-red-800 break-words border border-red-100">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="mt-6 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 mx-auto"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reload Census Portal</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
