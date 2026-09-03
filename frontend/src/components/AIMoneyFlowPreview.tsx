/**
 * ArgonNews - AI Money Flow: Compact Homepage Preview
 * High-performance, lightweight Canvas experience inspired by interactive Google Doodles.
 * Displays only the most significant/recent transactions in a compact footprint.
 * Hover triggers subtle highlights & tooltips; click opens the expanded visualization.
 */

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { AITransaction, Article } from '../types';
import { getTopTransactionsForPreview } from '../utils/transactionExtraction';
import { getCompanyTheme } from '../utils/companyThemes';
import { ArrowUpRight, Maximize2, Activity, DollarSign, Clock } from 'lucide-react';

interface AIMoneyFlowPreviewProps {
  transactions: AITransaction[];
  lastUpdated?: Date | null;
  onOpenExpanded: (selectedTxId?: string, selectedCompany?: string) => void;
  articles?: Article[];
}

interface PreviewNode {
  name: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  radius: number;
  role: string;
  isPrimary?: boolean;
}

interface PreviewEdge {
  tx: AITransaction;
  source: PreviewNode;
  target: PreviewNode;
}

export const AIMoneyFlowPreview: React.FC<AIMoneyFlowPreviewProps> = ({
  transactions,
  lastUpdated,
  onOpenExpanded,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredTx, setHoveredTx] = useState<AITransaction | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);
  const [isHoveringCanvas, setIsHoveringCanvas] = useState(false);

  // Top 5-6 transactions for compact preview
  const topTransactions = useMemo(() => {
    return getTopTransactionsForPreview(transactions, 5);
  }, [transactions]);

  // Extract distinct nodes involved in these top transactions
  const nodes = useMemo<PreviewNode[]>(() => {
    const nodeMap = new Map<string, PreviewNode>();

    topTransactions.forEach((tx) => {
      if (!nodeMap.has(tx.source_company)) {
        nodeMap.set(tx.source_company, {
          name: tx.source_company,
          x: 0,
          y: 0,
          targetX: 0,
          targetY: 0,
          radius: 27,
          role: 'Capital / Compute Provider',
          isPrimary: tx.source_company === 'NVIDIA' || tx.source_company === 'Microsoft',
        });
      }
      if (!nodeMap.has(tx.target_company)) {
        nodeMap.set(tx.target_company, {
          name: tx.target_company,
          x: 0,
          y: 0,
          targetX: 0,
          targetY: 0,
          radius: 25,
          role: 'Frontier AI Lab / Recipient',
        });
      }
    });

    return Array.from(nodeMap.values());
  }, [topTransactions]);

  // Layout node positions in canvas dimensions
  const layoutNodes = useCallback(
    (width: number, height: number): PreviewNode[] => {
      const placed = [...nodes];
      const count = placed.length;
      if (count === 0) return [];

      // Balanced two-tier horizontal flow: Sources on left/top-left, Recipients on right/center
      // E.g.: NVIDIA, Microsoft, Amazon on left; OpenAI, Hugging Face, Anthropic on right
      placed.forEach((node, i) => {
        let tx = 0.5;
        let ty = 0.5;

        if (node.name === 'NVIDIA') {
          tx = 0.22;
          ty = 0.35;
        } else if (node.name === 'Microsoft') {
          tx = 0.20;
          ty = 0.72;
        } else if (node.name === 'Hugging Face') {
          tx = 0.50;
          ty = 0.28;
        } else if (node.name === 'OpenAI') {
          tx = 0.55;
          ty = 0.70;
        } else if (node.name === 'Amazon / AWS') {
          tx = 0.78;
          ty = 0.30;
        } else if (node.name === 'Anthropic') {
          tx = 0.84;
          ty = 0.72;
        } else if (node.name === 'Oracle') {
          tx = 0.75;
          ty = 0.82;
        } else {
          // Dynamic spread if dataset varies
          const angle = (i / count) * Math.PI * 2;
          tx = 0.5 + Math.cos(angle) * 0.35;
          ty = 0.5 + Math.sin(angle) * 0.32;
        }

        node.targetX = tx * width;
        node.targetY = ty * height;
        if (node.x === 0 && node.y === 0) {
          node.x = node.targetX;
          node.y = node.targetY;
        }
      });

      return placed;
    },
    [nodes]
  );

  // Animated particles traveling along lines
  const particlesRef = useRef<Array<{ edgeIndex: number; progress: number; speed: number }>>([]);

  useEffect(() => {
    // Generate 12 flow particles
    particlesRef.current = Array.from({ length: 14 }, (_, i) => ({
      edgeIndex: i % Math.max(1, topTransactions.length),
      progress: (i * 0.17) % 1,
      speed: 0.003 + (i % 3) * 0.0015,
    }));
  }, [topTransactions]);

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 700);
    let height = (canvas.height = 190);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      const w = canvas.parentElement.clientWidth;
      const h = 190;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        width = w;
        height = h;
      }
    };

    window.addEventListener('resize', handleResize);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let startTime = performance.now();

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      ctx.clearRect(0, 0, width, height);

      const placedNodes = layoutNodes(width, height);
      const nodeLookup = new Map<string, PreviewNode>(placedNodes.map((n) => [n.name, n]));

      // 1. Subtle background grid dots for technical aesthetic
      ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
      const step = 28;
      for (let x = step; x < width; x += step) {
        for (let y = step; y < height; y += step) {
          ctx.fillRect(x, y, 1.5, 1.5);
        }
      }

      // 2. Build Edges
      const edges: PreviewEdge[] = [];
      topTransactions.forEach((tx) => {
        const src = nodeLookup.get(tx.source_company);
        const tgt = nodeLookup.get(tx.target_company);
        if (src && tgt) {
          edges.push({ tx, source: src, target: tgt });
        }
      });

      // 3. Draw Connection Lines
      edges.forEach((edge, idx) => {
        const { source, target, tx } = edge;
        const isTxHovered = hoveredTx?.id === tx.id;
        const isNodeHovered = hoveredNode === source.name || hoveredNode === target.name;
        const isHighlighted = isTxHovered || isNodeHovered;

        // Curved line with control point
        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2 + (idx % 2 === 0 ? -12 : 12);

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.quadraticCurveTo(midX, midY, target.x, target.y);

        if (isHighlighted) {
          ctx.strokeStyle = '#38bdf8'; // bright cyan highlight
          ctx.lineWidth = 2.5;
          ctx.shadowColor = 'rgba(56, 189, 248, 0.5)';
          ctx.shadowBlur = 8;
        } else {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.22)';
          ctx.lineWidth = tx.amount_disclosed && (tx.amount || 0) > 5_000_000_000 ? 2 : 1.2;
          ctx.shadowBlur = 0;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw small directional arrow head near target
        const tVal = 0.82;
        const arrowX = (1 - tVal) * (1 - tVal) * source.x + 2 * (1 - tVal) * tVal * midX + tVal * tVal * target.x;
        const arrowY = (1 - tVal) * (1 - tVal) * source.y + 2 * (1 - tVal) * tVal * midY + tVal * tVal * target.y;

        const nextT = 0.85;
        const nextX = (1 - nextT) * (1 - nextT) * source.x + 2 * (1 - nextT) * nextT * midX + nextT * nextT * target.x;
        const nextY = (1 - nextT) * (1 - nextT) * source.y + 2 * (1 - nextT) * nextT * midY + nextT * nextT * target.y;

        const angle = Math.atan2(nextY - arrowY, nextX - arrowX);

        ctx.save();
        ctx.translate(arrowX, arrowY);
        ctx.rotate(angle);
        ctx.fillStyle = isHighlighted ? '#38bdf8' : 'rgba(148, 163, 184, 0.4)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-6, -3.5);
        ctx.lineTo(-6, 3.5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Amount badge on middle of highlighted connection
        if (isHighlighted && tx.amount_formatted) {
          ctx.save();
          ctx.font = '600 10px monospace';
          ctx.fillStyle = '#f8fafc';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          const textMetrics = ctx.measureText(tx.amount_formatted);
          const bgW = textMetrics.width + 12;
          const bgH = 18;
          ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(midX - bgW / 2, midY - bgH / 2, bgW, bgH, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#38bdf8';
          ctx.fillText(tx.amount_formatted, midX, midY + 0.5);
          ctx.restore();
        }
      });

      // 4. Draw Animated Capital Flow Particles (unless reduced motion)
      if (!prefersReducedMotion && edges.length > 0) {
        particlesRef.current.forEach((p) => {
          p.progress = (p.progress + p.speed) % 1;
          const edge = edges[p.edgeIndex % edges.length];
          if (!edge) return;

          const { source, target } = edge;
          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2 + ((p.edgeIndex % 2) === 0 ? -12 : 12);

          const t = p.progress;
          const px = (1 - t) * (1 - t) * source.x + 2 * (1 - t) * t * midX + t * t * target.x;
          const py = (1 - t) * (1 - t) * source.y + 2 * (1 - t) * t * midY + t * t * target.y;

          ctx.beginPath();
          ctx.arc(px, py, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      // 5. Draw Company Bubbles
      placedNodes.forEach((node, i) => {
        // Gentle organic float
        const floatY = prefersReducedMotion ? 0 : Math.sin(elapsed * 1.5 + i) * 2;
        const curX = node.x;
        const curY = node.y + floatY;

        const isHovered = hoveredNode === node.name;
        const isConnectedToHoveredTx =
          hoveredTx && (hoveredTx.source_company === node.name || hoveredTx.target_company === node.name);

        const activeGlow = isHovered || isConnectedToHoveredTx;

        // Outer glow
        if (activeGlow) {
          ctx.beginPath();
          ctx.arc(curX, curY, node.radius + 6, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
          ctx.fill();
        }

        // Main circle fill
        ctx.beginPath();
        ctx.arc(curX, curY, node.radius, 0, Math.PI * 2);

        if (activeGlow) {
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
        } else if (node.isPrimary) {
          ctx.fillStyle = '#161b22';
          ctx.strokeStyle = '#30363d';
          ctx.lineWidth = 1.5;
        } else {
          ctx.fillStyle = '#13171f';
          ctx.strokeStyle = '#282e38';
          ctx.lineWidth = 1.2;
        }
        ctx.fill();
        ctx.stroke();

        // Node Label (clean, scannable)
        ctx.font = '600 11px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = activeGlow ? '#ffffff' : '#e2e8f0';

        // Abbreviate if long
        let label = node.name;
        if (label === 'Google / Alphabet') label = 'Google';
        if (label === 'Amazon / AWS') label = 'AWS';

        ctx.fillText(label, curX, curY);
      });

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [layoutNodes, topTransactions, hoveredNode, hoveredTx]);

  // Handle Mouse Hover & Click Hit Detection
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const placedNodes = layoutNodes(canvas.width, canvas.height);
    const nodeLookup = new Map<string, PreviewNode>(placedNodes.map((n) => [n.name, n]));

    // Check node hover
    let hitNode: PreviewNode | null = null;
    for (const node of placedNodes) {
      const dist = Math.hypot(node.x - mouseX, node.y - mouseY);
      if (dist <= node.radius + 6) {
        hitNode = node;
        break;
      }
    }

    if (hitNode) {
      setHoveredNode(hitNode.name);
      setHoveredTx(null);
      setTooltipPos({ x: hitNode.x, y: hitNode.y - hitNode.radius - 10 });
      return;
    }

    // Check edge hover (approximate distance to quadratic curve)
    let hitTx: AITransaction | null = null;
    topTransactions.forEach((tx, idx) => {
      const src = nodeLookup.get(tx.source_company);
      const tgt = nodeLookup.get(tx.target_company);
      if (!src || !tgt) return;

      const midX = (src.x + tgt.x) / 2;
      const midY = (src.y + tgt.y) / 2 + (idx % 2 === 0 ? -12 : 12);

      // Samples along curve
      for (let t = 0.2; t <= 0.8; t += 0.1) {
        const qx = (1 - t) * (1 - t) * src.x + 2 * (1 - t) * t * midX + t * t * tgt.x;
        const qy = (1 - t) * (1 - t) * src.y + 2 * (1 - t) * t * midY + t * t * tgt.y;
        if (Math.hypot(qx - mouseX, qy - mouseY) < 14) {
          hitTx = tx;
          setTooltipPos({ x: midX, y: midY - 14 });
          break;
        }
      }
    });

    if (hitTx) {
      setHoveredTx(hitTx);
      setHoveredNode(null);
    } else {
      setHoveredNode(null);
      setHoveredTx(null);
      setTooltipPos(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredNode(null);
    setHoveredTx(null);
    setTooltipPos(null);
    setIsHoveringCanvas(false);
  };

  // Format real relative time difference (e.g. "Data updated 3 minutes ago")
  const formattedTimeAgo = useMemo(() => {
    if (!lastUpdated) return 'Live dataset synchronized';
    const diffMs = Date.now() - new Date(lastUpdated).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Data updated just now';
    if (diffMin === 1) return 'Data updated 1 minute ago';
    if (diffMin < 60) return `Data updated ${diffMin} minutes ago`;
    const diffHours = Math.floor(diffMin / 60);
    return `Data updated ${diffHours}h ago`;
  }, [lastUpdated]);

  return (
    <div
      ref={containerRef}
      id="ai-money-flow-preview-card"
      className="mb-8 rounded-xl border border-[#2a313c] bg-gradient-to-b from-[#111620] to-[#0d1117] p-4 text-[#e6edf3] shadow-md transition-all hover:border-[#38bdf8]/40"
    >
      {/* Header bar */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-emerald-400 border border-emerald-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              CAPITAL FLOWS
            </span>
            <h2 className="font-serif text-lg font-bold tracking-tight text-[#f0f6fc]">
              AI Money Flow
            </h2>
          </div>
          <p className="mt-0.5 text-xs text-[#8b949e]">
            Follow the transactions shaping the AI industry.
          </p>
        </div>

        {/* Action affordance & timestamp */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className="hidden items-center gap-1 text-[11px] text-[#6e7681] md:inline-flex">
            <Clock className="h-3 w-3 text-[#58a6ff]" />
            {formattedTimeAgo}
          </span>

          <button
            type="button"
            onClick={() => onOpenExpanded(hoveredTx?.id, hoveredNode || undefined)}
            className="group inline-flex items-center gap-1.5 rounded-lg border border-[#30363d] bg-[#161b22] px-3 py-1.5 text-xs font-semibold text-[#f0f6fc] transition-all hover:border-[#38bdf8] hover:bg-[#1f2937] hover:text-[#38bdf8] cursor-pointer"
            aria-label="Explore AI Money Flow expanded visualization"
          >
            <span>Explore AI Money Flow</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-[#38bdf8]" />
          </button>
        </div>
      </div>

      {/* Interactive Canvas Container (Click to expand) */}
      <div
        className="relative mt-3 h-[190px] w-full cursor-pointer overflow-hidden rounded-lg border border-[#21262d] bg-[#090d14]"
        onClick={() => onOpenExpanded(hoveredTx?.id, hoveredNode || undefined)}
        onMouseEnter={() => setIsHoveringCanvas(true)}
        onMouseLeave={handleMouseLeave}
        role="button"
        tabIndex={0}
        aria-label="Interactive AI Money Flow preview. Click to open full visualization."
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpenExpanded(hoveredTx?.id, hoveredNode || undefined);
          }
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          className="h-full w-full block"
        />

        {/* Hover Tooltip (non-intrusive preview) */}
        {tooltipPos && (hoveredNode || hoveredTx) && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 transform rounded-md border border-[#38bdf8]/60 bg-[#0d1117]/95 px-2.5 py-1.5 text-xs shadow-xl backdrop-blur-sm"
            style={{
              left: `${Math.max(80, Math.min(tooltipPos.x, (canvasRef.current?.width || 600) - 80))}px`,
              top: `${Math.max(10, tooltipPos.y)}px`,
            }}
          >
            {hoveredNode && (
              <div className="font-mono text-[11px] font-semibold text-[#f0f6fc]">
                <span className="text-[#38bdf8]">{hoveredNode}</span>
                <span className="ml-1 text-[10px] text-[#8b949e]">· Click to view ecosystem role</span>
              </div>
            )}
            {hoveredTx && (
              <div className="flex flex-col text-left">
                <span className="font-mono text-[11px] font-semibold text-[#38bdf8]">
                  {hoveredTx.source_company} → {hoveredTx.target_company}
                </span>
                <span className="text-[10px] text-[#c9d1d9]">
                  {hoveredTx.amount_formatted} · {hoveredTx.transaction_type} ({hoveredTx.announcement_date.slice(0, 4)})
                </span>
              </div>
            )}
          </div>
        )}

        {/* Unobtrusive expand overlay prompt on hover */}
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-1 flex items-center justify-center transition-opacity duration-200 ${
            isHoveringCanvas ? 'opacity-90' : 'opacity-0'
          }`}
        >
          <span className="inline-flex items-center gap-1 rounded-full bg-[#161b22]/90 px-2.5 py-0.5 text-[10px] font-medium text-[#8b949e] border border-[#30363d] backdrop-blur-sm">
            <Maximize2 className="h-2.5 w-2.5 text-[#38bdf8]" />
            Click anywhere to launch full interactive map
          </span>
        </div>
      </div>

      {/* Scannable Recent Deals Strip */}
      <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6e7681] shrink-0">
          Featured:
        </span>
        {topTransactions.map((tx) => (
          <button
            key={tx.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenExpanded(tx.id);
            }}
            className="group inline-flex items-center gap-1.5 rounded-md border border-[#21262d] bg-[#161b22]/60 px-2.5 py-1 text-[11px] text-[#c9d1d9] transition-all hover:border-[#38bdf8]/50 hover:bg-[#1c2333] hover:text-[#f0f6fc] shrink-0 cursor-pointer"
          >
            <span className="font-semibold text-[#f0f6fc]">{tx.source_company}</span>
            <span className="text-[#38bdf8]">→</span>
            <span className="font-semibold text-[#f0f6fc]">{tx.target_company}</span>
            <span className="font-mono text-[#58a6ff]">
              {tx.amount_disclosed ? tx.amount_formatted : 'Strategic'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
