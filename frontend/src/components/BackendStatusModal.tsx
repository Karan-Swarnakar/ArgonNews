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
  ExternalLink,
  BookOpen
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
  const [testUrl, setTestUrl] = useState<string>(apiStatus.endpoint.replace(/\/articles.*$/, '') || 'http://localhost:8000');
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="backend-status-modal-card"
        className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/80 my-8 overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-6 py-4">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-bold font-mono uppercase tracking-wider text-slate-200">
              Backend Integration & Diagnostic Hub
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-800 bg-slate-900 p-1.5 text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Current Status Card */}
          <div
            className={`rounded-xl border p-4 ${
              apiStatus.isMock
                ? 'border-amber-500/30 bg-amber-950/20'
                : apiStatus.connected
                ? 'border-emerald-500/30 bg-emerald-950/20'
                : 'border-rose-500/30 bg-rose-950/20'
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  {apiStatus.isMock ? (
                    <span className="flex h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
                  ) : apiStatus.connected ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-400" />
                  )}
                  <span className="font-mono font-bold text-sm">
                    {apiStatus.isMock
                      ? 'Currently Using Development Mock Data'
                      : apiStatus.connected
                      ? 'Live Python Backend Connected'
                      : 'Backend Connection Failed'}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-300">
                  {apiStatus.isMock
                    ? 'Displaying 5 preloaded realistic intelligence articles from src/data/mockArticles.ts.'
                    : apiStatus.connected
                    ? `Successfully received ${apiStatus.articleCount} articles from ${apiStatus.endpoint}.`
                    : apiStatus.errorMessage || 'Unable to connect to your Python server.'}
                </p>
              </div>

              <button
                onClick={onToggleDataSource}
                className={`shrink-0 rounded-lg px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
                  apiStatus.isMock
                    ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                    : 'bg-cyan-500 text-slate-950 hover:bg-cyan-400'
                }`}
              >
                {apiStatus.isMock ? 'Switch to Live API' : 'Switch to Mock Data'}
              </button>
            </div>
          </div>

          {/* Test Live Backend Endpoint */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 space-y-3">
            <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
              Live Backend Endpoint Ping
            </h3>
            <p className="text-xs text-slate-400">
              Enter your local or remote Python server address to verify if the frontend can reach <code className="text-cyan-300 font-mono">/articles</code>.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={testUrl}
                onChange={(e) => setTestUrl(e.target.value)}
                placeholder="http://localhost:8000"
                className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 font-mono text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
              <button
                onClick={handleTestConnection}
                disabled={testing}
                className="flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-cyan-950/60 px-3.5 py-1.5 text-xs font-mono text-cyan-300 hover:bg-cyan-900/60 disabled:opacity-50 transition-colors"
              >
                {testing ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                <span>Test Ping</span>
              </button>
            </div>

            {testResult && (
              <div
                className={`rounded-lg border p-3 text-xs font-mono ${
                  testResult.success
                    ? 'border-emerald-500/30 bg-emerald-950/30 text-emerald-300'
                    : 'border-rose-500/30 bg-rose-950/30 text-rose-300'
                }`}
              >
                {testResult.message}
              </div>
            )}
          </div>

          {/* Python Backend Quickstart Snippets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-300">
                1-Minute Python Backend Code
              </h3>
              <span className="text-[11px] text-slate-500 font-mono">
                Copy into your Python project directory
              </span>
            </div>

            {/* FastAPI Option */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
              <div className="flex items-center justify-between bg-slate-900/90 px-3.5 py-2 border-b border-slate-800 text-xs font-mono text-slate-300">
                <span>Option A: FastAPI (Recommended)</span>
                <button
                  onClick={() => copyToClipboard(fastApiSnippet, 'fastapi')}
                  className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors"
                >
                  {copiedSnippet === 'fastapi' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedSnippet === 'fastapi' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3.5 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
                {fastApiSnippet}
              </pre>
            </div>

            {/* Flask Option */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden">
              <div className="flex items-center justify-between bg-slate-900/90 px-3.5 py-2 border-b border-slate-800 text-xs font-mono text-slate-300">
                <span>Option B: Flask</span>
                <button
                  onClick={() => copyToClipboard(flaskSnippet, 'flask')}
                  className="flex items-center gap-1 text-slate-400 hover:text-cyan-300 transition-colors"
                >
                  {copiedSnippet === 'flask' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedSnippet === 'flask' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-3.5 font-mono text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
                {flaskSnippet}
              </pre>
            </div>
          </div>

          {/* Documentation notice */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-400 space-y-1">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-cyan-400" />
              Full Step-by-Step Guide
            </div>
            <p>
              Check the generated <code className="text-cyan-300 font-mono">BACKEND_INTEGRATION.md</code> file in the project root for complete, beginner-friendly instructions covering endpoints, CORS, JSON schema, and troubleshooting.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-slate-800 bg-slate-950/90 px-6 py-3.5">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
