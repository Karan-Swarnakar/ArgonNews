/**
 * ArgonNews - AI Money Flow: Immersive Expanded Visualization
 * Interactive, data-driven financial ecosystem map inspired by interactive Doodles.
 * Displays real, primary-sourced capital flows, M&A, and infrastructure commitments.
 */

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { AITransaction, AICompanyProfile, Article } from '../types';
import { filterTransactionsByTimeWindow } from '../utils/transactionExtraction';
import { deriveCompanyProfiles } from '../data/mockTransactions';
import { getCompanyLogo, drawCompanyLogo, drawCompanyMonogram, CompanyLogoIcon, getShortLabel } from '../assets/companyLogos';
import { TransactionCard } from './TransactionCard';
import { X, ZoomIn, ZoomOut, RotateCcw, DollarSign } from 'lucide-react';

const ACCENT = '#38bdf8';
// The node simulation always lays out in at least this much space, independent of the
// actual viewport, so bubbles never get squeezed into overlap on narrow (mobile) screens.
// Small viewports instead auto-fit via zoom/pan, with pinch/drag available for detail.
const WORLD_MIN_WIDTH = 980;
const WORLD_MIN_HEIGHT = 680;

interface AIMoneyFlowExpandedProps {
  transactions: AITransaction[];
  articles?: Article[];
  initialSelectedTxId?: string;
  initialSelectedCompany?: string;
  lastUpdated?: Date | null;
  onClose: () => void;
  onOpenArticleModal?: (article: Article) => void;
}

interface SimNode {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  profile: AICompanyProfile;
  isDragging?: boolean;
}

interface SimEdge {
  tx: AITransaction;
  source: SimNode;
  target: SimNode;
}

export const AIMoneyFlowExpanded: React.FC<AIMoneyFlowExpandedProps> = ({
  transactions,
  articles = [],
  initialSelectedTxId,
  initialSelectedCompany,
  onClose,
  onOpenArticleModal,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [timeWindow, setTimeWindow] = useState<'recent' | '90d' | '6m' | '1y' | 'all'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');

  const [selectedTx, setSelectedTx] = useState<AITransaction | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<AICompanyProfile | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredTx, setHoveredTx] = useState<AITransaction | null>(null);
  const [tooltipInfo, setTooltipInfo] = useState<{ x: number; y: number } | null>(null);

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const startPanRef = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef<SimNode | null>(null);
  const dragOriginRef = useRef<{ x: number; y: number } | null>(null);
  const manualViewRef = useRef(false);

  // On narrow (mobile) viewports, center on a readable zoom level rather than
  // shrinking the whole (much wider) graph to fit -- text stays legible and the
  // user pans/pinches to explore the rest. Stops once they've adjusted it manually.
  useEffect(() => {
    const fitToContainer = () => {
      if (manualViewRef.current) return;
      const el = containerRef.current;
      if (!el) return;
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      if (cw >= WORLD_MIN_WIDTH) return;
      const readableZoom = Math.max(0.62, Math.min(0.85, ch / WORLD_MIN_HEIGHT));
      setZoom(readableZoom);
      setPan({ x: (cw - WORLD_MIN_WIDTH * readableZoom) / 2, y: (ch - WORLD_MIN_HEIGHT * readableZoom) / 2 });
    };
    fitToContainer();
    window.addEventListener('resize', fitToContainer);
    return () => window.removeEventListener('resize', fitToContainer);
  }, []);

  const filteredTransactions = useMemo(() => {
    let list = filterTransactionsByTimeWindow(transactions, timeWindow);
    if (selectedType !== 'all') {
      list = list.filter((t) => t.transaction_type === selectedType);
    }
    return list;
  }, [transactions, timeWindow, selectedType]);

  const companyProfiles = useMemo(() => deriveCompanyProfiles(filteredTransactions), [filteredTransactions]);

  // Initialize selection if specified
  useEffect(() => {
    if (initialSelectedTxId) {
      const found = transactions.find((t) => t.id === initialSelectedTxId);
      if (found) {
        setSelectedTx(found);
        setSelectedCompany(null);
      }
    } else if (initialSelectedCompany) {
      const profile = companyProfiles.find((c) => c.name === initialSelectedCompany);
      if (profile) {
        setSelectedCompany(profile);
        setSelectedTx(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSelectedTxId, initialSelectedCompany, transactions]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const nodesRef = useRef<SimNode[]>([]);

  useEffect(() => {
    const width = Math.max(containerRef.current?.clientWidth || 1000, WORLD_MIN_WIDTH);
    const height = Math.max(containerRef.current?.clientHeight || 650, WORLD_MIN_HEIGHT);

    const existingMap = new Map<string, SimNode>(nodesRef.current.map((n) => [n.name, n]));
    const newNodes: SimNode[] = [];

    companyProfiles.forEach((profile, i) => {
      const existing = existingMap.get(profile.name);
      const baseRadius = 27;
      const volBonus =
        profile.total_invested_usd + profile.total_received_usd > 10_000_000_000
          ? 13
          : profile.transactions_count > 2
          ? 7
          : 0;
      const radius = baseRadius + volBonus;

      if (existing) {
        existing.profile = profile;
        existing.radius = radius;
        newNodes.push(existing);
      } else {
        const angle = (i / Math.max(1, companyProfiles.length)) * Math.PI * 2;
        const dist = 180 + (i % 3) * 90;
        newNodes.push({
          id: profile.id,
          name: profile.name,
          x: width / 2 + Math.cos(angle) * dist + (Math.random() - 0.5) * 40,
          y: height / 2 + Math.sin(angle) * dist + (Math.random() - 0.5) * 40,
          vx: 0,
          vy: 0,
          radius,
          profile,
        });
      }
    });

    nodesRef.current = newNodes;
  }, [companyProfiles]);

  const particlesRef = useRef<Array<{ edgeIdx: number; progress: number; speed: number }>>([]);
  useEffect(() => {
    particlesRef.current = Array.from({ length: 32 }, (_, i) => ({
      edgeIdx: i % Math.max(1, filteredTransactions.length),
      progress: (i * 0.08) % 1,
      speed: 0.0026 + (i % 4) * 0.001,
    }));
  }, [filteredTransactions]);

  // Canvas render loop with spring physics & collision avoidance
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = canvas.parentElement?.clientWidth || 1000;
    let height = canvas.parentElement?.clientHeight || 650;

    const applySize = () => {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };
    applySize();

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;
      applySize();
    };
    window.addEventListener('resize', handleResize);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let startTime = performance.now();

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const simNodes = nodesRef.current;
      const nodeLookup = new Map<string, SimNode>(simNodes.map((n) => [n.name, n]));

      // Physics step: collision avoidance and gentle center gravitation.
      // Uses a world size decoupled from the actual viewport so bubbles always have
      // room to spread without overlapping on narrow (mobile) screens.
      const worldWidth = Math.max(width, WORLD_MIN_WIDTH);
      const worldHeight = Math.max(height, WORLD_MIN_HEIGHT);
      if (!prefersReducedMotion) {
        const centerX = worldWidth / 2;
        const centerY = worldHeight / 2;

        for (let i = 0; i < simNodes.length; i++) {
          const n1 = simNodes[i];
          if (n1.isDragging) continue;

          n1.vx += (centerX - n1.x) * 0.0004;
          n1.vy += (centerY - n1.y) * 0.0004;

          for (let j = i + 1; j < simNodes.length; j++) {
            const n2 = simNodes[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const dist = Math.hypot(dx, dy) || 1;
            const minDist = n1.radius + n2.radius + 36;

            if (dist < minDist) {
              const force = (minDist - dist) / dist;
              const fx = dx * force * 0.04;
              const fy = dy * force * 0.04;
              n1.vx -= fx;
              n1.vy -= fy;
              n2.vx += fx;
              n2.vy += fy;
            }
          }

          n1.vx *= 0.88;
          n1.vy *= 0.88;
          n1.x += n1.vx;
          n1.y += n1.vy;

          n1.x = Math.max(n1.radius + 40, Math.min(worldWidth - n1.radius - 40, n1.x));
          n1.y = Math.max(n1.radius + 60, Math.min(worldHeight - n1.radius - 60, n1.y));
        }
      }

      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // 1. Faint engineering grid
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      const gridSize = 42;
      for (let gx = -500; gx < width + 500; gx += gridSize) {
        for (let gy = -500; gy < height + 500; gy += gridSize) {
          ctx.fillRect(gx, gy, 1, 1);
        }
      }

      // 2. Build edges
      const edges: SimEdge[] = [];
      filteredTransactions.forEach((tx) => {
        const src = nodeLookup.get(tx.source_company);
        const tgt = nodeLookup.get(tx.target_company);
        if (src && tgt) edges.push({ tx, source: src, target: tgt });
      });

      // 3. Draw connection lines - single accent color throughout
      edges.forEach((edge, idx) => {
        const { source, target, tx } = edge;

        const isSelected = selectedTx?.id === tx.id;
        const isHovered = hoveredTx?.id === tx.id;
        const isConnectedToSelectedCompany =
          selectedCompany && (selectedCompany.name === source.name || selectedCompany.name === target.name);
        const isConnectedToHoveredNode = hoveredNode && (hoveredNode === source.name || hoveredNode === target.name);
        const isHighlighted = isSelected || isHovered || isConnectedToSelectedCompany || isConnectedToHoveredNode;

        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2 + (idx % 2 === 0 ? -20 : 20);

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.quadraticCurveTo(midX, midY, target.x, target.y);

        if (isHighlighted) {
          ctx.strokeStyle = ACCENT;
          ctx.lineWidth = isSelected ? 3 : 2.4;
          ctx.shadowColor = 'rgba(56, 189, 248, 0.55)';
          ctx.shadowBlur = 9;
        } else if (selectedTx || selectedCompany) {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.07)';
          ctx.lineWidth = 1;
          ctx.shadowBlur = 0;
        } else {
          let widthScale = 1.3;
          if (tx.amount_disclosed && tx.amount) {
            if (tx.amount >= 10_000_000_000) widthScale = 2.8;
            else if (tx.amount >= 1_000_000_000) widthScale = 2.1;
            else if (tx.amount >= 100_000_000) widthScale = 1.6;
          }
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.24)';
          ctx.lineWidth = widthScale;
          ctx.shadowBlur = 0;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Directional arrowhead
        const tVal = 0.84;
        const arrowX = (1 - tVal) * (1 - tVal) * source.x + 2 * (1 - tVal) * tVal * midX + tVal * tVal * target.x;
        const arrowY = (1 - tVal) * (1 - tVal) * source.y + 2 * (1 - tVal) * tVal * midY + tVal * tVal * target.y;
        const nextT = 0.88;
        const nextX = (1 - nextT) * (1 - nextT) * source.x + 2 * (1 - nextT) * nextT * midX + nextT * nextT * target.x;
        const nextY = (1 - nextT) * (1 - nextT) * source.y + 2 * (1 - nextT) * nextT * midY + nextT * nextT * target.y;
        const angle = Math.atan2(nextY - arrowY, nextX - arrowX);

        ctx.save();
        ctx.translate(arrowX, arrowY);
        ctx.rotate(angle);
        ctx.fillStyle = isHighlighted ? ACCENT : 'rgba(56, 189, 248, 0.38)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-7, -4);
        ctx.lineTo(-7, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      // 4. Animated capital flow particles
      if (!prefersReducedMotion && edges.length > 0) {
        particlesRef.current.forEach((p) => {
          p.progress = (p.progress + p.speed) % 1;
          const edge = edges[p.edgeIdx % edges.length];
          if (!edge) return;

          const { source, target, tx } = edge;
          const isHighlighted =
            selectedTx?.id === tx.id ||
            hoveredTx?.id === tx.id ||
            selectedCompany?.name === source.name ||
            selectedCompany?.name === target.name;

          if ((selectedTx || selectedCompany) && !isHighlighted) return;

          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2 + ((p.edgeIdx % 2) === 0 ? -20 : 20);

          const t = p.progress;
          const px = (1 - t) * (1 - t) * source.x + 2 * (1 - t) * t * midX + t * t * target.x;
          const py = (1 - t) * (1 - t) * source.y + 2 * (1 - t) * t * midY + t * t * target.y;

          ctx.beginPath();
          ctx.arc(px, py, isHighlighted ? 2.4 : 1.7, 0, Math.PI * 2);
          ctx.fillStyle = isHighlighted ? ACCENT : 'rgba(125, 211, 252, 0.6)';
          ctx.fill();
        });
      }

      // 5. Draw company bubbles
      simNodes.forEach((node, i) => {
        const floatY = prefersReducedMotion ? 0 : Math.sin(elapsed * 1.4 + i * 1.6) * 2;
        const curX = node.x;
        const curY = node.y + floatY;

        const isSelected = selectedCompany?.name === node.name;
        const isHovered = hoveredNode === node.name;
        const isConnectedToSelectedTx =
          selectedTx && (selectedTx.source_company === node.name || selectedTx.target_company === node.name);
        const isConnectedToHoveredTx =
          hoveredTx && (hoveredTx.source_company === node.name || hoveredTx.target_company === node.name);

        const isActive = isSelected || isHovered || isConnectedToSelectedTx || isConnectedToHoveredTx;
        const isDimmed = (selectedTx || selectedCompany) && !isActive;

        // Soft drop shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = isActive ? 18 : 10;
        ctx.shadowOffsetY = 4;
        ctx.beginPath();
        ctx.arc(curX, curY, node.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDimmed ? 'rgba(15, 18, 24, 0.55)' : isActive ? '#181f2a' : '#141922';
        ctx.fill();
        ctx.restore();

        // Border ring
        ctx.beginPath();
        ctx.arc(curX, curY, node.radius, 0, Math.PI * 2);
        if (isActive) {
          ctx.lineWidth = 2;
          ctx.strokeStyle = ACCENT;
        } else if (isDimmed) {
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
        } else {
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.09)';
        }
        ctx.stroke();

        if (isActive) {
          ctx.beginPath();
          ctx.arc(curX, curY, node.radius + 5, 0, Math.PI * 2);
          ctx.lineWidth = 1;
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
          ctx.stroke();
        }

        // Logo or elegant monogram fallback
        ctx.save();
        if (isDimmed) ctx.globalAlpha = 0.35;
        const logo = getCompanyLogo(node.name);
        if (logo) {
          drawCompanyLogo(ctx, logo, curX, curY, node.radius * 1.05, '#e6edf3');
        } else {
          drawCompanyMonogram(ctx, node.name, curX, curY, node.radius * 0.92, isActive ? '#f0f6fc' : '#9ba5b0');
        }
        ctx.restore();

        // Name label below bubble
        ctx.font = '500 12px "Plus Jakarta Sans", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isDimmed ? 'rgba(157, 165, 176, 0.35)' : isActive ? '#f0f6fc' : '#9ba5b0';
        ctx.fillText(getShortLabel(node.name), curX, curY + node.radius + 17);
      });

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [filteredTransactions, selectedTx, selectedCompany, hoveredNode, hoveredTx, pan, zoom]);

  const getVirtualCoords = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const rawX = clientX - rect.left;
      const rawY = clientY - rect.top;
      return { x: (rawX - pan.x) / zoom, y: (rawY - pan.y) / zoom };
    },
    [pan, zoom]
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedNodeRef.current) {
      const coords = getVirtualCoords(e.clientX, e.clientY);
      draggedNodeRef.current.x = coords.x;
      draggedNodeRef.current.y = coords.y;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
      return;
    }

    if (isPanningRef.current) {
      setPan({ x: e.clientX - startPanRef.current.x, y: e.clientY - startPanRef.current.y });
      return;
    }

    const coords = getVirtualCoords(e.clientX, e.clientY);
    const simNodes = nodesRef.current;
    const nodeLookup = new Map<string, SimNode>(simNodes.map((n) => [n.name, n]));

    let hitNode: SimNode | null = null;
    for (const node of simNodes) {
      const dist = Math.hypot(node.x - coords.x, node.y - coords.y);
      if (dist <= node.radius + 4) {
        hitNode = node;
        break;
      }
    }

    const localPos = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      return {
        x: e.clientX - (rect?.left || 0),
        y: e.clientY - (rect?.top || 0),
      };
    };

    if (hitNode) {
      setHoveredNode(hitNode.name);
      setHoveredTx(null);
      setTooltipInfo(localPos());
      return;
    }

    let hitTx: AITransaction | null = null;
    filteredTransactions.forEach((tx, idx) => {
      const src = nodeLookup.get(tx.source_company);
      const tgt = nodeLookup.get(tx.target_company);
      if (!src || !tgt) return;

      const midX = (src.x + tgt.x) / 2;
      const midY = (src.y + tgt.y) / 2 + (idx % 2 === 0 ? -20 : 20);

      for (let t = 0.2; t <= 0.8; t += 0.08) {
        const qx = (1 - t) * (1 - t) * src.x + 2 * (1 - t) * t * midX + t * t * tgt.x;
        const qy = (1 - t) * (1 - t) * src.y + 2 * (1 - t) * t * midY + t * t * tgt.y;
        if (Math.hypot(qx - coords.x, qy - coords.y) < 12) {
          hitTx = tx;
          break;
        }
      }
    });

    if (hitTx) {
      setHoveredTx(hitTx);
      setHoveredNode(null);
      setTooltipInfo(localPos());
    } else {
      setHoveredNode(null);
      setHoveredTx(null);
      setTooltipInfo(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getVirtualCoords(e.clientX, e.clientY);
    const simNodes = nodesRef.current;

    for (const node of simNodes) {
      if (Math.hypot(node.x - coords.x, node.y - coords.y) <= node.radius) {
        draggedNodeRef.current = node;
        dragOriginRef.current = { x: node.x, y: node.y };
        node.isDragging = true;
        return;
      }
    }

    manualViewRef.current = true;
    isPanningRef.current = true;
    startPanRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (draggedNodeRef.current) {
      const node = draggedNodeRef.current;
      const origin = dragOriginRef.current;
      node.isDragging = false;
      draggedNodeRef.current = null;
      dragOriginRef.current = null;

      // A release with negligible movement is a click/tap, not a drag -- select the company.
      const moved = origin ? Math.hypot(node.x - origin.x, node.y - origin.y) : 0;
      if (moved < 6) {
        setSelectedCompany(node.profile);
        setSelectedTx(null);
      }
      return;
    }

    if (isPanningRef.current) isPanningRef.current = false;

    const coords = getVirtualCoords(e.clientX, e.clientY);
    const simNodes = nodesRef.current;
    const nodeLookup = new Map<string, SimNode>(simNodes.map((n) => [n.name, n]));

    for (const node of simNodes) {
      if (Math.hypot(node.x - coords.x, node.y - coords.y) <= node.radius) {
        setSelectedCompany(node.profile);
        setSelectedTx(null);
        return;
      }
    }

    let clickedTx: AITransaction | null = null;
    filteredTransactions.forEach((tx, idx) => {
      const src = nodeLookup.get(tx.source_company);
      const tgt = nodeLookup.get(tx.target_company);
      if (!src || !tgt) return;

      const midX = (src.x + tgt.x) / 2;
      const midY = (src.y + tgt.y) / 2 + (idx % 2 === 0 ? -20 : 20);

      for (let t = 0.2; t <= 0.8; t += 0.08) {
        const qx = (1 - t) * (1 - t) * src.x + 2 * (1 - t) * t * midX + t * t * tgt.x;
        const qy = (1 - t) * (1 - t) * src.y + 2 * (1 - t) * t * midY + t * t * tgt.y;
        if (Math.hypot(qx - coords.x, qy - coords.y) < 14) {
          clickedTx = tx;
          break;
        }
      }
    });

    if (clickedTx) {
      setSelectedTx(clickedTx);
      setSelectedCompany(null);
    } else {
      setSelectedTx(null);
      setSelectedCompany(null);
    }
  };

  // Touch equivalents so dragging, panning, and tapping nodes/edges work on mobile.
  // handleMouseMove/Down/Up only read clientX/clientY, so a single-finger touch maps directly.
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const t = e.touches[0];
    if (!t) return;
    manualViewRef.current = true;
    handleMouseDown({ clientX: t.clientX, clientY: t.clientY } as React.MouseEvent<HTMLCanvasElement>);
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const t = e.touches[0];
    if (!t) return;
    handleMouseMove({ clientX: t.clientX, clientY: t.clientY } as React.MouseEvent<HTMLCanvasElement>);
  };
  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const t = e.changedTouches[0];
    if (!t) return;
    handleMouseUp({ clientX: t.clientX, clientY: t.clientY } as React.MouseEvent<HTMLCanvasElement>);
  };

  const matchingArticle = useMemo(() => {
    if (!selectedTx || articles.length === 0) return null;
    if (selectedTx.related_article_url) {
      const exact = articles.find((a) => a.url === selectedTx.related_article_url);
      if (exact) return exact;
    }
    const src = selectedTx.source_company.toLowerCase();
    const tgt = selectedTx.target_company.toLowerCase();
    return (
      articles.find((a) => {
        const text = `${a.title} ${a.analysis?.summary || ''}`.toLowerCase();
        return text.includes(src) && text.includes(tgt);
      }) || null
    );
  }, [selectedTx, articles]);

  const handleResetView = () => {
    manualViewRef.current = true;
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedTx(null);
    setSelectedCompany(null);
  };

  return (
    <div
      ref={containerRef}
      id="ai-money-flow-expanded-overlay"
      className="fixed inset-0 z-50 flex flex-col bg-[#0a0d12] text-[#e6edf3] select-none"
      role="dialog"
      aria-modal="true"
      aria-label="AI Money Flow: Immersive Capital Network Visualization"
    >
      {/* Refined floating close control */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Close AI Money Flow visualization"
        title="Close (Esc)"
        className="absolute right-4 top-4 z-50 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-[#c9d1d9] backdrop-blur-md transition-all hover:border-white/25 hover:bg-black/60 hover:text-white cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>

      {/* 1. Header Toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-[#0e1219] px-4 py-3 pr-16 sm:px-6">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#38bdf8]/25 bg-[#38bdf8]/10 text-[#38bdf8]">
            <DollarSign className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate font-serif text-lg font-semibold tracking-tight text-[#f0f6fc]">
                AI Money Flow
              </h1>
              <span className="hidden shrink-0 text-[11px] text-[#5c6470] sm:inline">
                {filteredTransactions.length} deals tracked
              </span>
            </div>
          </div>
        </div>

        {/* Time Window Filter Pills */}
        <div className="hidden items-center gap-0.5 rounded-lg border border-white/[0.06] bg-black/20 p-0.5 md:flex">
          {[
            { id: 'all', label: 'All' },
            { id: 'recent', label: '90d' },
            { id: '6m', label: '6mo' },
            { id: '1y', label: '1yr' },
          ].map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => setTimeWindow(w.id as any)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                timeWindow === w.id ? 'bg-[#38bdf8]/15 text-[#7dd3fc]' : 'text-[#7d8590] hover:text-[#f0f6fc]'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>

        {/* Zoom Controls */}
        <div className="hidden items-center gap-1 sm:flex">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2.0, z + 0.2))}
            className="rounded-lg p-1.5 text-[#9ba5b0] hover:bg-white/5 hover:text-[#f0f6fc] cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
            className="rounded-lg p-1.5 text-[#9ba5b0] hover:bg-white/5 hover:text-[#f0f6fc] cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleResetView}
            className="rounded-lg p-1.5 text-[#9ba5b0] hover:bg-white/5 hover:text-[#f0f6fc] cursor-pointer"
            title="Reset View"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. Secondary Filter Bar (deal types) */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-white/[0.06] bg-[#0b0e13] px-4 py-2 text-xs scrollbar-none sm:px-6">
        {[
          { id: 'all', label: 'All types' },
          { id: 'Acquisition', label: 'Acquisitions' },
          { id: 'Strategic Investment', label: 'Strategic stakes' },
          { id: 'Equity Round', label: 'Equity rounds' },
          { id: 'Infrastructure Commitment', label: 'Compute & chips' },
        ].map((type) => (
          <button
            key={type.id}
            type="button"
            onClick={() => setSelectedType(type.id)}
            className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
              selectedType === type.id
                ? 'bg-[#38bdf8]/15 text-[#7dd3fc]'
                : 'text-[#7d8590] hover:text-[#f0f6fc]'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* 3. Main Stage */}
      <div className="relative flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="block h-full w-full touch-none cursor-grab active:cursor-grabbing"
        />

        {/* Hover card */}
        {tooltipInfo && hoveredTx && !selectedTx && !selectedCompany && (
          <div
            className="pointer-events-none absolute z-30 w-80 max-w-[88vw] -translate-x-1/2 -translate-y-[calc(100%+14px)]"
            style={{ left: `${tooltipInfo.x}px`, top: `${tooltipInfo.y}px` }}
          >
            <TransactionCard tx={hoveredTx} variant="compact" />
          </div>
        )}
        {tooltipInfo && hoveredNode && !hoveredTx && !selectedTx && !selectedCompany && (
          <div
            className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-[calc(100%+10px)] rounded-md border border-[#2a313c] bg-[#12161d]/95 px-2.5 py-1.5 text-[11px] font-medium text-[#c9d1d9] shadow-lg"
            style={{ left: `${tooltipInfo.x}px`, top: `${tooltipInfo.y}px` }}
          >
            {hoveredNode} · click to view role
          </div>
        )}

        {/* Persistent Transaction Detail Card */}
        {selectedTx && (
          <div className="absolute right-4 top-4 z-40 w-full max-w-sm">
            <TransactionCard
              tx={selectedTx}
              variant="full"
              onClose={() => setSelectedTx(null)}
              matchingArticle={matchingArticle}
              onOpenArticle={onOpenArticleModal}
            />
          </div>
        )}

        {/* Persistent Company Profile Dossier */}
        {selectedCompany && !selectedTx && (
          <div className="absolute right-4 top-4 z-40 w-full max-w-sm rounded-xl border border-[#2a313c] bg-[#12161d]/[0.98] p-5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <CompanyLogoIcon name={selectedCompany.name} size={22} monoColor="#e6edf3" />
                <h3 className="truncate font-serif text-base font-semibold text-[#f0f6fc]">
                  {selectedCompany.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCompany(null)}
                className="shrink-0 rounded-full p-1 text-[#6e7681] hover:bg-white/5 hover:text-[#f0f6fc] cursor-pointer"
                aria-label="Close company profile"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <p className="mt-1.5 text-[13px] text-[#9ba5b0]">{selectedCompany.role}</p>

            <div className="mt-3.5 grid grid-cols-2 gap-2.5">
              <div>
                <div className="text-[10px] uppercase tracking-wide text-[#5c6470]">Deployed</div>
                <div className="mt-0.5 font-mono text-sm font-semibold text-[#f0f6fc]">
                  {selectedCompany.total_invested_usd > 0
                    ? `$${(selectedCompany.total_invested_usd / 1e9).toFixed(2)}B`
                    : '—'}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wide text-[#5c6470]">Raised</div>
                <div className="mt-0.5 font-mono text-sm font-semibold text-[#f0f6fc]">
                  {selectedCompany.total_received_usd > 0
                    ? `$${(selectedCompany.total_received_usd / 1e9).toFixed(2)}B`
                    : '—'}
                </div>
              </div>
            </div>

            <div className="mt-4 border-t border-white/[0.06] pt-3">
              <div className="text-[10px] uppercase tracking-wide text-[#5c6470]">
                Deals ({selectedCompany.transactions_count})
              </div>
              <div className="mt-1.5 max-h-52 space-y-1 overflow-y-auto pr-1">
                {filteredTransactions
                  .filter((t) => t.source_company === selectedCompany.name || t.target_company === selectedCompany.name)
                  .map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTx(t)}
                      className="w-full cursor-pointer rounded-md px-2 py-1.5 text-left text-[12px] transition-colors hover:bg-white/[0.04]"
                    >
                      <div className="flex items-center justify-between gap-2 text-[#e6edf3]">
                        <span className="truncate">
                          {t.source_company} → {t.target_company}
                        </span>
                        <span className="shrink-0 font-mono text-[11px] text-[#7d8590]">
                          {t.amount_disclosed ? t.amount_formatted : '—'}
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
