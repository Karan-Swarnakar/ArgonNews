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
  BookOpen,
} from 'lucide-react';
import { ApiStatus } from '../types';
import { testBackendConnection } from '../api/articles';

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
    apiStatus.endpoint.replace(/\/articles.*$/, '') || 'http://localhost:8000'
  );
  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testBackendConnection(testUrl);
    setTestResult(result);
    setTesting(false);
  };

  const copyToClipboard = (text: string, id: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedSnippet(id);
      setTimeout(() => setCopiedSnippet(null), 2000);
    }
  };

  const fastApiSnippet = `# Minimal FastAPI server to serve your articles.json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json

app = FastAPI(title="ArgonNews Backend API")

# Enable CORS for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/articles")
def get_articles():
    with open("articles.json", "r", encoding="utf-8") as f:
        return json.load(f)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)`;

  const flaskSnippet = `# Minimal Flask server to serve your articles.json
from flask import Flask, jsonify
from flask_cors import CORS
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route("/articles", methods=["GET"])
def get_articles():
    with open("articles.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    return jsonify(data)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)`;

  return (
    <div
      id="backend-status-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-xs overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="backend-status-modal-card"
        className="relative w-full max-w-2xl rounded border border-[#30363d] bg-[#0e1013] shadow-2xl my-6 overflow-hidden text-[#e2e8f0]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#22272e] bg-[#0a0c0e] px-5 py-3.5">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-amber-400" />
            <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-[#f0f6fc]">
              Backend Integration & System Diagnostics
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded border border-[#30363d] bg-[#14161a] p-1.5 text-[#8b949e] hover:text-white transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Current Status Card */}
          <div
            className={`rounded border p-4 font-mono text-xs ${
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
                      ? 'Local Production / Demo Data'
                      : apiStatus.connected
                      ? 'Live Python Server Connected'
                      : 'Backend Connection Inactive'}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-[#8b949e] font-sans">
                  {apiStatus.isMock
                    ? 'Loading verified intelligence dispatches from public articles dataset.'
                    : apiStatus.connected
                    ? `Active stream containing ${apiStatus.articleCount} articles from ${apiStatus.endpoint}.`
                    : apiStatus.errorMessage || 'No response on standard localhost / remote API.'}
                </p>
              </div>

              <button
                onClick={onToggleDataSource}
                className="shrink-0 rounded border border-[#30363d] bg-[#161b22] px-3 py-1 text-xs font-mono text-[#f0f6fc] hover:bg-[#21262d] transition-colors"
              >
                {apiStatus.isMock ? 'Switch to Live API' : 'Switch to Local Cache'}
              </button>
            </div>
          </div>

          {/* Test Live Backend Endpoint */}
          <div className="rounded border border-[#22272e] bg-[#121418] p-4 space-y-3">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#c9d1d9]">
              API Endpoint Verification
            </h3>
            <p className="text-xs text-[#8b949e] font-sans">
              Enter target Python server URL to probe connectivity:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="http://localhost:8000"
                className="flex-1 rounded border border-[#30363d] bg-[#161b22] px-3 py-1.5 font-mono text-xs text-[#f0f6fc] focus:border-[#58a6ff] focus:outline-none"
              />
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="flex items-center gap-1.5 rounded border border-[#30363d] bg-[#1c2128] px-3 py-1.5 text-xs font-mono text-[#c9d1d9] hover:bg-[#21262d] hover:text-white disabled:opacity-50 transition-colors"
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
                {testResult.message}
              </div>
            )}
          </div>

          {/* Python Server Snippets */}
          <div className="space-y-3">
            <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-[#c9d1d9]">
              Minimal Python Server Examples
            </h3>

            {/* FastAPI */}
            <div className="rounded border border-[#22272e] bg-[#0c0e11] overflow-hidden">
              <div className="flex items-center justify-between bg-[#14161a] px-3 py-1.5 border-b border-[#22272e] text-xs font-mono text-[#8b949e]">
                <span>FastAPI Example</span>
                <button
                  onClick={() => copyToClipboard(fastApiSnippet, 'fastapi')}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  {copiedSnippet === 'fastapi' ? <Check className="h-3 w-3 text-[#7ee787]" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedSnippet === 'fastapi' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3 font-mono text-[11px] text-[#8b949e] overflow-x-auto leading-relaxed">
                {fastApiSnippet}
              </pre>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-[#22272e] bg-[#0a0c0e] px-5 py-3">
          <button
            onClick={onClose}
            className="rounded border border-[#30363d] bg-[#161b22] px-4 py-1.5 text-xs font-mono text-[#c9d1d9] hover:bg-[#21262d] hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
