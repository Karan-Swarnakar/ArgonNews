import React from 'react';
import { AlertCircle, RefreshCw, Radio, Terminal } from 'lucide-react';

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
    <div className="mb-6 rounded border border-rose-900/50 bg-[#161214] p-4 text-[#e2e8f0]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-rose-200 uppercase tracking-wide">
              Live Wire Disconnected
            </span>
            <p className="mt-0.5 text-[#8b949e] font-sans">
              {errorMessage}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <button
            onClick={onRetry}
            className="flex items-center gap-1 rounded border border-[#30363d] bg-[#161b22] px-2.5 py-1 text-xs text-[#c9d1d9] hover:bg-[#21262d] transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Retry</span>
          </button>
          
          <button
            onClick={onUseMock}
            className="flex items-center gap-1 rounded border border-amber-800/60 bg-amber-950/30 px-2.5 py-1 text-xs text-amber-200 hover:bg-amber-900/40 transition-colors"
          >
            <Radio className="h-3 w-3" />
            <span>Use Local Cache</span>
          </button>

          <button
            onClick={onOpenDiagnostics}
            className="flex items-center gap-1 rounded border border-[#30363d] bg-[#161b22] px-2.5 py-1 text-xs text-[#8b949e] hover:text-white transition-colors"
          >
            <Terminal className="h-3 w-3" />
            <span>Diagnostics</span>
          </button>
        </div>
      </div>
    </div>
  );
};
