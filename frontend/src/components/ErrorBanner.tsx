import React from 'react';
import { AlertTriangle, RefreshCw, Radio, Terminal } from 'lucide-react';

interface ErrorBannerProps {
  errorMessage: string;
  onRetry: () => void;
  onUseMock: () => void;
  onOpenDiagnostics: () => void;
}

export const ErrorBanner: React.FC<ErrorBannerProps> = ({
  errorMessage,
  onRetry,
  onUseMock,
  onOpenDiagnostics,
}) => {
  return (
    <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-950/30 p-4 sm:p-5 text-slate-100 shadow-lg shadow-rose-950/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-rose-500/20 p-2 text-rose-400 shrink-0 mt-0.5">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-rose-200">
              Backend Connection Notice
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-slate-300">
              {errorMessage}
            </p>
            <p className="mt-1 text-xs text-rose-300/80 font-mono">
              Tip: Is your Python server running and CORS enabled? You can switch to Mock Data to explore the UI immediately.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:shrink-0">
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry</span>
          </button>
          
          <button
            onClick={onUseMock}
            className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/20 px-3 py-1.5 text-xs font-mono font-semibold text-amber-200 hover:bg-amber-500/30 transition-colors"
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Switch to Mock Data</span>
          </button>

          <button
            onClick={onOpenDiagnostics}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/60 px-3 py-1.5 text-xs font-mono text-cyan-300 hover:bg-cyan-900/60 transition-colors"
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Diagnostics</span>
          </button>
        </div>
      </div>
    </div>
  );
};
