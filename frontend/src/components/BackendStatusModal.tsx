import React, { useState } from 'react';
import {
  X,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Play,
  Copy,
  Check,
  RefreshCw,
  Clock,
  Database,
  Cloud,
  Layers,
  Zap,
} from 'lucide-react';
import { ApiStatus } from '../types';
import { testBackendConnection, triggerManualIngestion } from '../api/articles';

interface BackendStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiStatus: ApiStatus;
  onToggleDataSource: () => void;
  onRefresh: () => void;
}

export const BackendStatusModal: React.FC<BackendStatusModalProps> = ({
  isOpen,
  onClose,
  apiStatus,
  onToggleDataSource,
  onRefresh,
}) => {
  const [testUrl, setTestUrl] = useState<string>(
    apiStatus.endpoint.replace(/\/articles.*$/, '').replace(/\/api.*$/, '') || '/api'
  );
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    count?: number;
    details?: any;
  } | null>(null);

  const [ingesting, setIngesting] = useState<boolean>(false);
  const [ingestResult, setIngestResult] = useState<{
    success: boolean;
    message: string;
    result?: any;
  } | null>(null);

  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testBackendConnection(testUrl);
    setTestResult(result);
    setTesting(false);
  };

  const handleTriggerIngestion = async () => {
    setIngesting(true);
    setIngestResult(null);
    const result = await triggerManualIngestion();
    setIngestResult(result);
    setIngesting(false);
    if (result.success) {
      onRefresh();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedSnippet(id);
      setTimeout(() => setCopiedSnippet(null), 2000);
    }
  };

  const deploySnippet = `# 1. Create Cloudflare D1 Database
npx wrangler d1 create argonnews-db

# 2. Apply Initial Schema
npx wrangler d1 migrations apply argonnews-db --remote

# 3. Deploy Worker with Cron & Static Assets
npm run build
npx wrangler deploy`;

  return (
    <div
      id="backend-status-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="backend-status-modal-card"
        className="relative w-full max-w-2xl rounded-lg border border-[#30363d] bg-[#0e1013] shadow-2xl my-6 overflow-hidden text-[#e2e8f0]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#22272e] bg-[#0a0c0e] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-amber-400" />
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[#f0f6fc]">
              Autonomous Engine & Infrastructure Status
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded border border-[#30363d] bg-[#14161a] p-1.5 text-[#8b949e] hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Current Status Card */}
          <div
            className={`rounded-lg border p-4 font-mono text-xs ${
              apiStatus.isMock
                ? 'border-amber-800/40 bg-amber-950/20 text-amber-200'
                : apiStatus.connected
                ? 'border-emerald-800/40 bg-emerald-950/20 text-emerald-200'
                : 'border-rose-800/40 bg-rose-950/20 text-rose-200'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  {apiStatus.isMock ? (
                    <span className="flex h-2 w-2 rounded-full bg-amber-400" />
                  ) : apiStatus.connected ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#7ee787]" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                  )}
                  <span className="font-bold">
                    {apiStatus.isMock
                      ? 'Local Baseline / Static Fallback'
                      : apiStatus.connected
                      ? 'Cloudflare Autonomous Engine Active'
                      : 'Live Engine Connection Inactive'}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-[#8b949e] font-sans leading-relaxed">
                  {apiStatus.isMock
                    ? 'Loading verified baseline intelligence archive with client-side deduplication.'
                    : apiStatus.connected
                    ? `Live autonomous pipeline active (${apiStatus.articleCount} dispatches loaded from ${apiStatus.endpoint}).`
                    : apiStatus.errorMessage || 'No response from local or production API.'}
                </p>
              </div>

              <button
                onClick={onToggleDataSource}
                className="shrink-0 rounded border border-[#30363d] bg-[#161b22] px-3 py-1 text-xs font-mono text-[#f0f6fc] hover:bg-[#21262d] transition-colors cursor-pointer"
              >
                {apiStatus.isMock ? 'Switch to Live API' : 'Switch to Local Cache'}
              </button>
            </div>
          </div>

          {/* Autonomous Architecture Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg border border-[#22272e] bg-[#121418] p-3">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-amber-400 font-semibold mb-1">
                <Clock className="h-3.5 w-3.5" />
                <span>Cron Schedule</span>
              </div>
              <p className="text-xs text-[#c9d1d9] font-mono">*/30 * * * *</p>
              <p className="text-[10px] text-[#8b949e] font-sans mt-0.5">Runs every 30m in cloud</p>
            </div>

            <div className="rounded-lg border border-[#22272e] bg-[#121418] p-3">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400 font-semibold mb-1">
                <Database className="h-3.5 w-3.5" />
                <span>Cloudflare D1</span>
              </div>
              <p className="text-xs text-[#c9d1d9] font-mono">argonnews-db</p>
              <p className="text-[10px] text-[#8b949e] font-sans mt-0.5">Persistent edge SQL</p>
            </div>

            <div className="rounded-lg border border-[#22272e] bg-[#121418] p-3">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-blue-400 font-semibold mb-1">
                <Zap className="h-3.5 w-3.5" />
                <span>Client Polling</span>
              </div>
              <p className="text-xs text-[#c9d1d9] font-mono">Every 5 min</p>
              <p className="text-[10px] text-[#8b949e] font-sans mt-0.5">Seamless live banner</p>
            </div>
          </div>

          {/* Manual Ingestion Trigger */}
          <div className="rounded-lg border border-[#22272e] bg-[#121418] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#c9d1d9]">
                  Trigger Ingestion Run
                </h3>
                <p className="text-xs text-[#8b949e] font-sans mt-0.5">
                  Fetch all 36+ AI research labs and feeds immediately.
                </p>
              </div>
              <button
                onClick={handleTriggerIngestion}
                disabled={ingesting}
                className="flex items-center gap-1.5 rounded border border-amber-600/60 bg-amber-950/40 px-3 py-1.5 text-xs font-mono text-amber-200 hover:bg-amber-900/50 disabled:opacity-50 transition-colors cursor-pointer"
              >
                {ingesting ? (
                  <RefreshCw className="h-3 w-3 animate-spin text-amber-400" />
                ) : (
                  <Zap className="h-3 w-3 text-amber-400" />
                )}
                <span>{ingesting ? 'Ingesting Feeds...' : 'Run Pipeline Now'}</span>
              </button>
            </div>

            {ingestResult && (
              <div
                className={`rounded border p-2.5 text-xs font-mono ${
                  ingestResult.success
                    ? 'border-emerald-800/40 bg-emerald-950/30 text-[#7ee787]'
                    : 'border-rose-800/40 bg-rose-950/30 text-rose-300'
                }`}
              >
                <div className="font-semibold">{ingestResult.message}</div>
                {ingestResult.result && (
                  <div className="text-[11px] mt-1 text-[#8b949e]">
                    Attempted: {ingestResult.result.sourcesAttempted} sources | Succeeded:{' '}
                    {ingestResult.result.sourcesSucceeded} | Articles Found:{' '}
                    {ingestResult.result.articlesFound} | Inserted:{' '}
                    {ingestResult.result.articlesInserted}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Test Live Backend Endpoint */}
          <div className="rounded-lg border border-[#22272e] bg-[#121418] p-4 space-y-3">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#c9d1d9]">
              API Diagnostics & Probe
            </h3>
            <p className="text-xs text-[#8b949e] font-sans">
              Probe custom endpoint or production Worker API:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="/api"
                className="flex-1 rounded border border-[#30363d] bg-[#161b22] px-3 py-1.5 font-mono text-xs text-[#f0f6fc] focus:border-[#58a6ff] focus:outline-none"
              />
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="flex items-center gap-1.5 rounded border border-[#30363d] bg-[#1c2128] px-3 py-1.5 text-xs font-mono text-[#c9d1d9] hover:bg-[#21262d] hover:text-white disabled:opacity-50 transition-colors cursor-pointer"
              >
                {testing ? (
                  <RefreshCw className="h-3 w-3 animate-spin text-amber-400" />
                ) : (
                  <Play className="h-3 w-3" />
                )}
                <span>Ping</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`rounded border p-2.5 text-xs font-mono ${
                  testResult.success
                    ? 'border-emerald-800/40 bg-emerald-950/30 text-[#7ee787]'
                    : 'border-rose-800/40 bg-rose-950/30 text-rose-300'
                }`}
              >
                <p>{testResult.message}</p>
                {testResult.details && (
                  <pre className="mt-1 text-[10px] text-[#8b949e] overflow-x-auto">
                    {JSON.stringify(testResult.details, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </div>

          {/* Deployment Snippet */}
          <div className="space-y-2">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#c9d1d9]">
              Production Deployment Commands
            </h3>
            <div className="rounded-lg border border-[#22272e] bg-[#0c0e11] overflow-hidden">
              <div className="flex items-center justify-between bg-[#14161a] px-3 py-1.5 border-b border-[#22272e] text-xs font-mono text-[#8b949e]">
                <span>Cloudflare Wrangler CLI</span>
                <button
                  onClick={() => copyToClipboard(deploySnippet, 'deploy')}
                  className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
                >
                  {copiedSnippet === 'deploy' ? (
                    <Check className="h-3 w-3 text-[#7ee787]" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  <span>{copiedSnippet === 'deploy' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3 font-mono text-[11px] text-[#8b949e] overflow-x-auto leading-relaxed">
                {deploySnippet}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#22272e] bg-[#0a0c0e] px-5 py-3">
          <span className="font-mono text-[11px] text-[#6e7681]">
            ArgonNews Autonomous Engine v3.0
          </span>
          <button
            onClick={onClose}
            className="rounded border border-[#30363d] bg-[#161b22] px-4 py-1.5 text-xs font-mono text-[#c9d1d9] hover:bg-[#21262d] hover:text-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
