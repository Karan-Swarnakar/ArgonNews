/**
 * ArgonNews - AI Money Flow: Compact Homepage Preview
 * A restrained, editorial interactive canvas inspired by Google Doodles.
 * Displays only the most significant/recent transactions in a compact footprint.
 * Hover reveals a compact deal card; click opens the full visualization.
 */

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { AITransaction, Article } from '../types';
import { getTopTransactionsForPreview } from '../utils/transactionExtraction';
import { getCompanyLogo, drawCompanyLogo, drawCompanyMonogram, getShortLabel } from '../assets/companyLogos';
import { TransactionCard } from './TransactionCard';
import { ArrowUpRight, Sparkles } from 'lucide-react';

const ACCENT = '#38bdf8';

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
  baseRadius: number;
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

  // Top transactions for compact preview
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
          radius: 28,
          baseRadius: 28,
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
          radius: 26,
          baseRadius: 26,
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

      // Shrink bubbles slightly on narrow (mobile) widths so closely-placed nodes
      // keep breathing room instead of touching.
      const radiusScale = Math.max(0.62, Math.min(1, width / 620));

      placed.forEach((node, i) => {
        node.radius = node.baseRadius * radiusScale;
        let tx = 0.5;
        let ty = 0.5;

        if (node.name === 'NVIDIA') {
          tx = 0.2;
          ty = 0.36;
        } else if (node.name === 'Microsoft') {
          tx = 0.18;
          ty = 0.74;
        } else if (node.name === 'Hugging Face') {
          tx = 0.48;
          ty = 0.26;
        } else if (node.name === 'OpenAI') {
          tx = 0.55;
          ty = 0.72;
        } else if (node.name === 'Amazon / AWS') {
          tx = 0.8;
          ty = 0.28;
        } else if (node.name === 'Anthropic') {
          tx = 0.86;
          ty = 0.72;
        } else if (node.name === 'Oracle') {
          tx = 0.78;
          ty = 0.86;
        } else {
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
    particlesRef.current = Array.from({ length: 10 }, (_, i) => ({
      edgeIndex: i % Math.max(1, topTransactions.length),
      progress: (i * 0.17) % 1,
      speed: 0.0022 + (i % 3) * 0.001,
    }));
  }, [topTransactions]);

  // Main Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let cssWidth = canvas.parentElement?.clientWidth || 700;
    let cssHeight = 224;

    const applySize = () => {
      canvas.width = cssWidth * dpr;
      canvas.height = cssHeight * dpr;
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
    };
    applySize();

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      const w = canvas.parentElement.clientWidth;
      if (w !== cssWidth) {
        cssWidth = w;
        applySize();
      }
    };
    window.addEventListener('resize', handleResize);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let startTime = performance.now();

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      const width = cssWidth;
      const height = cssHeight;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const placedNodes = layoutNodes(width, height);
      const nodeLookup = new Map<string, PreviewNode>(placedNodes.map((n) => [n.name, n]));

      // 1. Faint background grid dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
      const step = 30;
      for (let x = step; x < width; x += step) {
        for (let y = step; y < height; y += step) {
          ctx.fillRect(x, y, 1, 1);
        }
      }

      // 2. Build edges
      const edges: PreviewEdge[] = [];
      topTransactions.forEach((tx) => {
        const src = nodeLookup.get(tx.source_company);
        const tgt = nodeLookup.get(tx.target_company);
        if (src && tgt) edges.push({ tx, source: src, target: tgt });
      });

      // 3. Draw connection lines - single accent color throughout
      edges.forEach((edge, idx) => {
        const { source, target, tx } = edge;
        const isTxHovered = hoveredTx?.id === tx.id;
        const isNodeHovered = hoveredNode === source.name || hoveredNode === target.name;
        const isHighlighted = isTxHovered || isNodeHovered;

        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2 + (idx % 2 === 0 ? -12 : 12);

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.quadraticCurveTo(midX, midY, target.x, target.y);

        let widthScale = 1.1;
        if (tx.amount_disclosed && tx.amount) {
          if (tx.amount >= 10_000_000_000) widthScale = 2.2;
          else if (tx.amount >= 1_000_000_000) widthScale = 1.7;
          else if (tx.amount >= 100_000_000) widthScale = 1.3;
        }

        if (isHighlighted) {
          ctx.strokeStyle = ACCENT;
          ctx.lineWidth = widthScale + 1.1;
          ctx.shadowColor = 'rgba(56, 189, 248, 0.45)';
          ctx.shadowBlur = 7;
        } else {
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
          ctx.lineWidth = widthScale;
          ctx.shadowBlur = 0;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Directional arrowhead
        const tVal = 0.84;
        const arrowX = (1 - tVal) * (1 - tVal) * source.x + 2 * (1 - tVal) * tVal * midX + tVal * tVal * target.x;
        const arrowY = (1 - tVal) * (1 - tVal) * source.y + 2 * (1 - tVal) * tVal * midY + tVal * tVal * target.y;
        const nextT = 0.87;
        const nextX = (1 - nextT) * (1 - nextT) * source.x + 2 * (1 - nextT) * nextT * midX + nextT * nextT * target.x;
        const nextY = (1 - nextT) * (1 - nextT) * source.y + 2 * (1 - nextT) * nextT * midY + nextT * nextT * target.y;
        const angle = Math.atan2(nextY - arrowY, nextX - arrowX);

        ctx.save();
        ctx.translate(arrowX, arrowY);
        ctx.rotate(angle);
        ctx.fillStyle = isHighlighted ? ACCENT : 'rgba(56, 189, 248, 0.35)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-5.5, -3.2);
        ctx.lineTo(-5.5, 3.2);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      // 4. Animated capital flow particles
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
          ctx.arc(px, py, 1.8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(125, 211, 252, 0.85)';
          ctx.fill();
        });
      }

      // 5. Draw company bubbles
      placedNodes.forEach((node, i) => {
        const floatY = prefersReducedMotion ? 0 : Math.sin(elapsed * 1.3 + i * 1.7) * 1.6;
        const curX = node.x;
        const curY = node.y + floatY;

        const isHovered = hoveredNode === node.name;
        const isConnectedToHoveredTx =
          hoveredTx && (hoveredTx.source_company === node.name || hoveredTx.target_company === node.name);
        const isActive = isHovered || isConnectedToHoveredTx;

        // Soft drop shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
        ctx.shadowBlur = isActive ? 14 : 8;
        ctx.shadowOffsetY = 3;
        ctx.beginPath();
        ctx.arc(curX, curY, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = isActive ? '#171d27' : '#141922';
        ctx.fill();
        ctx.restore();

        // Border ring
        ctx.beginPath();
        ctx.arc(curX, curY, node.radius, 0, Math.PI * 2);
        ctx.lineWidth = isActive ? 1.6 : 1;
        ctx.strokeStyle = isActive ? ACCENT : 'rgba(255, 255, 255, 0.09)';
        ctx.stroke();

        if (isActive) {
          ctx.beginPath();
          ctx.arc(curX, curY, node.radius + 4, 0, Math.PI * 2);
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
          ctx.stroke();
        }

        // Logo (or elegant monogram fallback), generous breathing room
        const logo = getCompanyLogo(node.name);
        if (logo) {
          drawCompanyLogo(ctx, logo, curX, curY, node.radius * 1.08, '#e6edf3');
        } else {
          drawCompanyMonogram(ctx, node.name, curX, curY, node.radius, isActive ? '#f0f6fc' : '#9ba5b0');
        }

        // Name label below bubble
        ctx.font = '500 11px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isActive ? '#f0f6fc' : '#7d8590';
        ctx.fillText(getShortLabel(node.name), curX, curY + node.radius + 15);
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

    const placedNodes = layoutNodes(rect.width, rect.height);
    const nodeLookup = new Map<string, PreviewNode>(placedNodes.map((n) => [n.name, n]));

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

    let hitTx: AITransaction | null = null;
    topTransactions.forEach((tx, idx) => {
      const src = nodeLookup.get(tx.source_company);
      const tgt = nodeLookup.get(tx.target_company);
      if (!src || !tgt) return;

      const midX = (src.x + tgt.x) / 2;
      const midY = (src.y + tgt.y) / 2 + (idx % 2 === 0 ? -12 : 12);

      for (let t = 0.2; t <= 0.8; t += 0.1) {
        const qx = (1 - t) * (1 - t) * src.x + 2 * (1 - t) * t * midX + t * t * tgt.x;
        const qy = (1 - t) * (1 - t) * src.y + 2 * (1 - t) * t * midY + t * t * tgt.y;
        if (Math.hypot(qx - mouseX, qy - mouseY) < 14) {
          hitTx = tx;
          setTooltipPos({ x: midX, y: midY });
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

  const formattedTimeAgo = useMemo(() => {
    if (!lastUpdated) return 'Live dataset';
    const diffMs = Date.now() - new Date(lastUpdated).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Updated just now';
    if (diffMin === 1) return 'Updated 1 minute ago';
    if (diffMin < 60) return `Updated ${diffMin} minutes ago`;
    const diffHours = Math.floor(diffMin / 60);
    return `Updated ${diffHours}h ago`;
  }, [lastUpdated]);

  const canvasWidth = canvasRef.current?.parentElement?.clientWidth || 600;

  return (
    <div
      ref={containerRef}
      id="ai-money-flow-preview-card"
      className="mb-8 rounded-xl border border-[#242b35] bg-[#0e1219] p-4 text-[#e6edf3] shadow-sm transition-colors hover:border-[#2f3946]"
    >
      {/* Header bar */}
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-[#38bdf8]" />
            <h2 className="font-serif text-lg font-semibold tracking-tight text-[#f0f6fc]">
              AI Money Flow
            </h2>
          </div>
          <p className="mt-0.5 text-[13px] text-[#7d8590]">
            The deals shaping the AI industry, mapped.
          </p>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <span className="hidden text-[11px] text-[#5c6470] md:inline-block">{formattedTimeAgo}</span>

          <button
            type="button"
            onClick={() => onOpenExpanded(hoveredTx?.id, hoveredNode || undefined)}
            className="group inline-flex items-center gap-1.5 rounded-lg border border-[#2a313c] px-3 py-1.5 text-[13px] font-medium text-[#c9d1d9] transition-colors hover:border-[#38bdf8]/50 hover:text-[#f0f6fc] cursor-pointer"
            aria-label="Explore AI Money Flow expanded visualization"
          >
            <span>Explore</span>
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>

      {/* Interactive canvas (click to expand) */}
      <div
        className="relative mt-3 h-[224px] w-full cursor-pointer overflow-hidden rounded-lg bg-[#0a0d12]"
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
        <canvas ref={canvasRef} onMouseMove={handleMouseMove} className="block h-full w-full" />

        {/* Hover card */}
        {tooltipPos && hoveredTx && (
          <div
            className="pointer-events-none absolute z-20 w-72 max-w-[85vw] -translate-x-1/2"
            style={{
              left: `${Math.max(140, Math.min(tooltipPos.x, canvasWidth - 140))}px`,
              top: `${Math.max(0, tooltipPos.y - 8)}px`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <TransactionCard tx={hoveredTx} variant="compact" />
          </div>
        )}
        {tooltipPos && hoveredNode && !hoveredTx && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full rounded-md border border-[#2a313c] bg-[#12161d]/95 px-2.5 py-1.5 text-[11px] font-medium text-[#c9d1d9] shadow-lg"
            style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}
          >
            {hoveredNode} · view role
          </div>
        )}

        {/* Unobtrusive expand hint */}
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-2 flex items-center justify-center transition-opacity duration-200 ${
            isHoveringCanvas && !hoveredNode && !hoveredTx ? 'opacity-80' : 'opacity-0'
          }`}
        >
          <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/40 px-2.5 py-0.5 text-[10px] font-medium text-[#9ba5b0] backdrop-blur-sm">
            Click to explore the full map
          </span>
        </div>
      </div>

      {/* Featured deals strip */}
      <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-0.5 text-xs scrollbar-none">
        {topTransactions.map((tx) => (
          <button
            key={tx.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenExpanded(tx.id);
            }}
            className="group inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#242b35] bg-[#12161d]/60 px-2.5 py-1 text-[11px] text-[#9ba5b0] transition-colors hover:border-[#38bdf8]/40 hover:text-[#f0f6fc] cursor-pointer"
          >
            <span className="font-medium text-[#e6edf3]">{tx.source_company}</span>
            <span className="text-[#38bdf8]">→</span>
            <span className="font-medium text-[#e6edf3]">{tx.target_company}</span>
            <span className="text-[#5c6470]">
              {tx.amount_disclosed ? tx.amount_formatted : 'Undisclosed'}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
