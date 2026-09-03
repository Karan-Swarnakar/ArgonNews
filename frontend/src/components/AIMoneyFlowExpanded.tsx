/**
 * ArgonNews - AI Money Flow: Immersive Expanded Visualization
 * Interactive, data-driven financial ecosystem map inspired by interactive JavaScript Doodles.
 * Displays real, primary-sourced capital flows, M&A, and infrastructure commitments.
 */

import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { AITransaction, AICompanyProfile, Article, TransactionType } from '../types';
import { filterTransactionsByTimeWindow } from '../utils/transactionExtraction';
import { deriveCompanyProfiles } from '../data/mockTransactions';
import {
  X,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ExternalLink,
  DollarSign,
  Building2,
  Layers,
  ArrowRight,
  TrendingUp,
  Newspaper,
  ShieldCheck,
  Calendar,
  HelpCircle,
} from 'lucide-react';

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
  lastUpdated,
  onClose,
  onOpenArticleModal,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Time window filter state
  const [timeWindow, setTimeWindow] = useState<'recent' | '90d' | '6m' | '1y' | 'all'>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selection & inspection state
  const [selectedTx, setSelectedTx] = useState<AITransaction | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<AICompanyProfile | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hoveredTx, setHoveredTx] = useState<AITransaction | null>(null);
  const [tooltipInfo, setTooltipInfo] = useState<{ x: number; y: number; text: string; subtext?: string } | null>(null);

  // Pan and Zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const startPanRef = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef<SimNode | null>(null);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    let list = filterTransactionsByTimeWindow(transactions, timeWindow);

    if (selectedType !== 'all') {
      list = list.filter((t) => t.transaction_type === selectedType);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.source_company.toLowerCase().includes(q) ||
          t.target_company.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }

    return list;
  }, [transactions, timeWindow, selectedType, searchQuery]);

  // Derived companies from current filtered transactions
  const companyProfiles = useMemo(() => {
    return deriveCompanyProfiles(filteredTransactions);
  }, [filteredTransactions]);

  const companyMap = useMemo(() => {
    return new Map(companyProfiles.map((c) => [c.name, c]));
  }, [companyProfiles]);

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
  }, [initialSelectedTxId, initialSelectedCompany, transactions, companyProfiles]);

  // Keyboard shortcut: Escape key closes modal
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

  // Lock body scroll when expanded
  useEffect(() => {
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  // Simulation nodes state
  const nodesRef = useRef<SimNode[]>([]);
  const initializedLayoutRef = useRef(false);

  // Initialize or update simulation nodes
  useEffect(() => {
    const width = containerRef.current?.clientWidth || 1000;
    const height = containerRef.current?.clientHeight || 650;

    const existingMap = new Map<string, SimNode>(nodesRef.current.map((n) => [n.name, n]));
    const newNodes: SimNode[] = [];

    companyProfiles.forEach((profile, i) => {
      const existing = existingMap.get(profile.name);
      // Sizing based on transaction importance and volume
      const baseRadius = 24;
      const volBonus = profile.total_invested_usd + profile.total_received_usd > 10_000_000_000 ? 12 : profile.transactions_count > 2 ? 6 : 0;
      const radius = baseRadius + volBonus;

      if (existing) {
        existing.profile = profile;
        existing.radius = radius;
        newNodes.push(existing);
      } else {
        // Distribute in concentric orbits
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
    initializedLayoutRef.current = true;
  }, [companyProfiles]);

  // Animation particles
  const particlesRef = useRef<Array<{ edgeIdx: number; progress: number; speed: number }>>([]);
  useEffect(() => {
    particlesRef.current = Array.from({ length: 45 }, (_, i) => ({
      edgeIdx: i % Math.max(1, filteredTransactions.length),
      progress: (i * 0.08) % 1,
      speed: 0.003 + (i % 4) * 0.0012,
    }));
  }, [filteredTransactions]);

  // Canvas render loop with spring physics & collision avoidance
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 1000);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 650);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
      width = canvas.width;
      height = canvas.height;
    };
    window.addEventListener('resize', handleResize);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let startTime = performance.now();

    const render = (now: number) => {
      const elapsed = (now - startTime) / 1000;
      ctx.clearRect(0, 0, width, height);

      const simNodes = nodesRef.current;
      const nodeLookup = new Map<string, SimNode>(simNodes.map((n) => [n.name, n]));

      // Physics step: collision avoidance and gentle center gravitation
      if (!prefersReducedMotion) {
        const centerX = width / 2;
        const centerY = height / 2;

        for (let i = 0; i < simNodes.length; i++) {
          const n1 = simNodes[i];
          if (n1.isDragging) continue;

          // Pull to center
          n1.vx += (centerX - n1.x) * 0.0004;
          n1.vy += (centerY - n1.y) * 0.0004;

          // Repulsion between nodes
          for (let j = i + 1; j < simNodes.length; j++) {
            const n2 = simNodes[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const dist = Math.hypot(dx, dy) || 1;
            const minDist = n1.radius + n2.radius + 32;

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

          // Damping & position update
          n1.vx *= 0.88;
          n1.vy *= 0.88;
          n1.x += n1.vx;
          n1.y += n1.vy;

          // Keep in bounds
          n1.x = Math.max(n1.radius + 40, Math.min(width - n1.radius - 40, n1.x));
          n1.y = Math.max(n1.radius + 60, Math.min(height - n1.radius - 60, n1.y));
        }
      }

      ctx.save();
      // Apply pan & zoom
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // 1. Subtle Engineering Grid
      ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
      const gridSize = 40;
      for (let gx = -500; gx < width + 500; gx += gridSize) {
        for (let gy = -500; gy < height + 500; gy += gridSize) {
          ctx.fillRect(gx, gy, 1.5, 1.5);
        }
      }

      // 2. Build Edges
      const edges: SimEdge[] = [];
      filteredTransactions.forEach((tx) => {
        const src = nodeLookup.get(tx.source_company);
        const tgt = nodeLookup.get(tx.target_company);
        if (src && tgt) {
          edges.push({ tx, source: src, target: tgt });
        }
      });

      // 3. Draw Connection Lines
      edges.forEach((edge, idx) => {
        const { source, target, tx } = edge;

        const isSelected = selectedTx?.id === tx.id;
        const isHovered = hoveredTx?.id === tx.id;
        const isConnectedToSelectedCompany =
          selectedCompany &&
          (selectedCompany.name === source.name || selectedCompany.name === target.name);
        const isConnectedToHoveredNode =
          hoveredNode && (hoveredNode === source.name || hoveredNode === target.name);

        const isHighlighted = isSelected || isHovered || isConnectedToSelectedCompany || isConnectedToHoveredNode;

        const midX = (source.x + target.x) / 2;
        const midY = (source.y + target.y) / 2 + (idx % 2 === 0 ? -20 : 20);

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.quadraticCurveTo(midX, midY, target.x, target.y);

        if (isHighlighted) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = Math.max(2.5, isSelected ? 3.5 : 2.5);
          ctx.shadowColor = 'rgba(56, 189, 248, 0.7)';
          ctx.shadowBlur = 10;
        } else {
          // Dim if other item selected
          if (selectedTx || selectedCompany) {
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.08)';
            ctx.lineWidth = 1;
          } else {
            // Line thickness mapped to transaction amount when disclosed
            let widthScale = 1.4;
            if (tx.amount_disclosed && tx.amount) {
              if (tx.amount >= 10_000_000_000) widthScale = 3.2;
              else if (tx.amount >= 1_000_000_000) widthScale = 2.4;
              else if (tx.amount >= 100_000_000) widthScale = 1.8;
            }
            ctx.strokeStyle = tx.transaction_type === 'Acquisition' ? 'rgba(251, 191, 36, 0.35)' : 'rgba(56, 189, 248, 0.28)';
            ctx.lineWidth = widthScale;
          }
          ctx.shadowBlur = 0;
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw Directional Arrowhead
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
        ctx.fillStyle = isHighlighted ? '#38bdf8' : 'rgba(148, 163, 184, 0.45)';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-7, -4);
        ctx.lineTo(-7, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Transaction Amount Pill on highlighted connections
        if (isHighlighted && tx.amount_formatted) {
          ctx.save();
          ctx.font = '600 11px monospace';
          const textMetrics = ctx.measureText(tx.amount_formatted);
          const bgW = textMetrics.width + 16;
          const bgH = 20;

          ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.roundRect(midX - bgW / 2, midY - bgH / 2, bgW, bgH, 4);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(tx.amount_formatted, midX, midY + 0.5);
          ctx.restore();
        }
      });

      // 4. Draw Animated Capital Flow Particles (traveling in transaction direction)
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

          // If something else is selected, hide background particles
          if ((selectedTx || selectedCompany) && !isHighlighted) return;

          const midX = (source.x + target.x) / 2;
          const midY = (source.y + target.y) / 2 + ((p.edgeIdx % 2) === 0 ? -20 : 20);

          const t = p.progress;
          const px = (1 - t) * (1 - t) * source.x + 2 * (1 - t) * t * midX + t * t * target.x;
          const py = (1 - t) * (1 - t) * source.y + 2 * (1 - t) * t * midY + t * t * target.y;

          ctx.beginPath();
          ctx.arc(px, py, isHighlighted ? 3 : 2, 0, Math.PI * 2);
          ctx.fillStyle = isHighlighted ? '#38bdf8' : 'rgba(56, 189, 248, 0.7)';
          ctx.shadowColor = '#38bdf8';
          ctx.shadowBlur = isHighlighted ? 8 : 4;
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }

      // 5. Draw Company Bubbles
      simNodes.forEach((node, i) => {
        const floatY = prefersReducedMotion ? 0 : Math.sin(elapsed * 1.8 + i) * 2.5;
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

        // Outer glow on active nodes
        if (isActive) {
          ctx.beginPath();
          ctx.arc(curX, curY, node.radius + 8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
          ctx.fill();
        }

        // Main Bubble
        ctx.beginPath();
        ctx.arc(curX, curY, node.radius, 0, Math.PI * 2);

        if (isActive) {
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
        } else if (isDimmed) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
          ctx.strokeStyle = 'rgba(48, 54, 61, 0.4)';
          ctx.lineWidth = 1;
        } else {
          // Color code by tier
          ctx.fillStyle = '#161b22';
          ctx.strokeStyle = node.profile.tier === 'hardware' ? '#e3b341' : node.profile.tier === 'frontier-lab' ? '#58a6ff' : '#8b949e';
          ctx.lineWidth = 1.6;
        }
        ctx.fill();
        ctx.stroke();

        // Node Label
        ctx.font = '600 12px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = isDimmed ? 'rgba(201, 209, 217, 0.3)' : isActive ? '#ffffff' : '#e6edf3';

        let label = node.name;
        if (label === 'Google / Alphabet') label = 'Google';
        if (label === 'Amazon / AWS') label = 'AWS';

        ctx.fillText(label, curX, curY - 3);

        // Sublabel: transaction count badge
        ctx.font = '500 9px monospace';
        ctx.fillStyle = isDimmed ? 'rgba(139, 148, 158, 0.3)' : '#8b949e';
        ctx.fillText(`${node.profile.transactions_count} deals`, curX, curY + 10);
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

  // Convert client mouse coordinates to canvas virtual space
  const getVirtualCoords = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const rawX = clientX - rect.left;
      const rawY = clientY - rect.top;
      return {
        x: (rawX - pan.x) / zoom,
        y: (rawY - pan.y) / zoom,
      };
    },
    [pan, zoom]
  );

  // Mouse move handler (hover detection & dragging)
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // 1. Handle dragging node
    if (draggedNodeRef.current) {
      const coords = getVirtualCoords(e.clientX, e.clientY);
      draggedNodeRef.current.x = coords.x;
      draggedNodeRef.current.y = coords.y;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
      return;
    }

    // 2. Handle canvas panning
    if (isPanningRef.current) {
      setPan({
        x: e.clientX - startPanRef.current.x,
        y: e.clientY - startPanRef.current.y,
      });
      return;
    }

    // 3. Hit testing in virtual coordinates
    const coords = getVirtualCoords(e.clientX, e.clientY);
    const simNodes = nodesRef.current;
    const nodeLookup = new Map<string, SimNode>(simNodes.map((n) => [n.name, n]));

    // Check node hover
    let hitNode: SimNode | null = null;
    for (const node of simNodes) {
      const dist = Math.hypot(node.x - coords.x, node.y - coords.y);
      if (dist <= node.radius + 4) {
        hitNode = node;
        break;
      }
    }

    if (hitNode) {
      setHoveredNode(hitNode.name);
      setHoveredTx(null);
      setTooltipInfo({
        x: e.clientX - (containerRef.current?.getBoundingClientRect().left || 0),
        y: e.clientY - (containerRef.current?.getBoundingClientRect().top || 0) - 25,
        text: hitNode.name,
        subtext: `${hitNode.profile.role} · ${hitNode.profile.transactions_count} transactions`,
      });
      return;
    }

    // Check edge hover
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
      setTooltipInfo({
        x: e.clientX - (containerRef.current?.getBoundingClientRect().left || 0),
        y: e.clientY - (containerRef.current?.getBoundingClientRect().top || 0) - 25,
        text: `${hitTx.source_company} → ${hitTx.target_company}`,
        subtext: `${hitTx.amount_formatted} · ${hitTx.transaction_type}`,
      });
    } else {
      setHoveredNode(null);
      setHoveredTx(null);
      setTooltipInfo(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getVirtualCoords(e.clientX, e.clientY);
    const simNodes = nodesRef.current;

    // Check if clicked on a node to drag or select
    for (const node of simNodes) {
      if (Math.hypot(node.x - coords.x, node.y - coords.y) <= node.radius) {
        draggedNodeRef.current = node;
        node.isDragging = true;
        return;
      }
    }

    // Otherwise initiate pan
    isPanningRef.current = true;
    startPanRef.current = {
      x: e.clientX - pan.x,
      y: e.clientY - pan.y,
    };
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // If was dragging node, release
    if (draggedNodeRef.current) {
      draggedNodeRef.current.isDragging = false;
      draggedNodeRef.current = null;
      return;
    }

    if (isPanningRef.current) {
      isPanningRef.current = false;
    }

    // Check click hit
    const coords = getVirtualCoords(e.clientX, e.clientY);
    const simNodes = nodesRef.current;
    const nodeLookup = new Map<string, SimNode>(simNodes.map((n) => [n.name, n]));

    // 1. Click Node -> select company profile
    for (const node of simNodes) {
      if (Math.hypot(node.x - coords.x, node.y - coords.y) <= node.radius) {
        setSelectedCompany(node.profile);
        setSelectedTx(null);
        return;
      }
    }

    // 2. Click Edge -> select transaction
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
      // Clicked on empty canvas -> clear active selection
      setSelectedTx(null);
      setSelectedCompany(null);
    }
  };

  // Find corresponding ArgonNews article for the selected transaction
  const matchingArticle = useMemo(() => {
    if (!selectedTx || articles.length === 0) return null;

    // 1. Exact match by related_article_url
    if (selectedTx.related_article_url) {
      const exact = articles.find((a) => a.url === selectedTx.related_article_url);
      if (exact) return exact;
    }

    // 2. Match by company pair in title or companies list
    const src = selectedTx.source_company.toLowerCase();
    const tgt = selectedTx.target_company.toLowerCase();

    return (
      articles.find((a) => {
        const text = `${a.title} ${a.analysis?.summary || ''}`.toLowerCase();
        return text.includes(src) && text.includes(tgt);
      }) || null
    );
  }, [selectedTx, articles]);

  // Reset zoom & pan
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedTx(null);
    setSelectedCompany(null);
  };

  return (
    <div
      ref={containerRef}
      id="ai-money-flow-expanded-overlay"
      className="fixed inset-0 z-50 flex flex-col bg-[#080b10] text-[#f0f6fc] select-none"
      role="dialog"
      aria-modal="true"
      aria-label="AI Money Flow: Immersive Capital Network Visualization"
    >
      {/* 1. Header Toolbar */}
      <div className="flex items-center justify-between border-b border-[#21262d] bg-[#0d1117] px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-serif text-lg font-bold tracking-tight text-[#f0f6fc] sm:text-xl">
                AI Money Flow
              </h1>
              <span className="rounded-full bg-[#1f2937] px-2 py-0.5 text-[10px] font-mono text-[#38bdf8] border border-[#374151]">
                {filteredTransactions.length} Tracked Deals
              </span>
            </div>
            <p className="text-xs text-[#8b949e] hidden sm:block">
              Interactive map of primary investments, acquisitions & compute agreements.
            </p>
          </div>
        </div>

        {/* Time Window Filter Pills */}
        <div className="hidden items-center gap-1 rounded-lg border border-[#21262d] bg-[#161b22] p-1 md:flex">
          {[
            { id: 'all', label: 'All Deals' },
            { id: 'recent', label: 'Recent 90d' },
            { id: '6m', label: '6 Months' },
            { id: '1y', label: '1 Year' },
          ].map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => setTimeWindow(w.id as any)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                timeWindow === w.id
                  ? 'bg-[#38bdf8] text-[#080b10] font-semibold'
                  : 'text-[#8b949e] hover:text-[#f0f6fc]'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>

        {/* Zoom Controls & Prominent Close Button */}
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-1 sm:flex">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.0, z + 0.2))}
              className="rounded-lg border border-[#30363d] bg-[#161b22] p-1.5 text-[#c9d1d9] hover:border-[#58a6ff] hover:text-[#ffffff] cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.5, z - 0.2))}
              className="rounded-lg border border-[#30363d] bg-[#161b22] p-1.5 text-[#c9d1d9] hover:border-[#58a6ff] hover:text-[#ffffff] cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleResetView}
              className="rounded-lg border border-[#30363d] bg-[#161b22] p-1.5 text-[#c9d1d9] hover:border-[#58a6ff] hover:text-[#ffffff] cursor-pointer"
              title="Reset View"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* CLOSE BUTTON: Clearly visible, high-contrast, accessible */}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-sm font-semibold text-red-300 hover:border-red-500 hover:bg-red-500/20 hover:text-white transition-all cursor-pointer shadow-sm"
            aria-label="Close AI Money Flow visualization"
          >
            <X className="h-4 w-4" />
            <span>Close (Esc)</span>
          </button>
        </div>
      </div>

      {/* 2. Secondary Filter Bar (Mobile & Deal Types) */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#21262d] bg-[#0b0e14] px-4 py-2 text-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#6e7681]">
            Type:
          </span>
          {[
            { id: 'all', label: 'All Types' },
            { id: 'Acquisition', label: 'M&A / Acquisitions' },
            { id: 'Strategic Investment', label: 'Strategic Stakes' },
            { id: 'Equity Round', label: 'Equity Financing' },
            { id: 'Infrastructure Commitment', label: 'Compute & Chips' },
          ].map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setSelectedType(type.id)}
              className={`rounded-full px-2.5 py-0.5 text-[11px] transition-all cursor-pointer ${
                selectedType === type.id
                  ? 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/50 font-semibold'
                  : 'bg-[#161b22] text-[#8b949e] border border-[#21262d] hover:text-[#f0f6fc]'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-[#8b949e]">
          <span>Tip: Drag nodes or click connections to inspect deal terms</span>
        </div>
      </div>

      {/* 3. Main Stage: Interactive Canvas & Persistent Side Panels */}
      <div className="relative flex-1 overflow-hidden">
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          className="h-full w-full block cursor-grab active:cursor-grabbing"
        />

        {/* Hover Tooltip */}
        {tooltipInfo && !selectedTx && !selectedCompany && (
          <div
            className="pointer-events-none absolute z-30 transform -translate-x-1/2 rounded-md border border-[#38bdf8]/60 bg-[#0d1117]/95 px-3 py-2 text-xs shadow-2xl backdrop-blur-md"
            style={{
              left: `${Math.max(120, Math.min(tooltipInfo.x, (canvasRef.current?.width || 800) - 120))}px`,
              top: `${Math.max(20, tooltipInfo.y)}px`,
            }}
          >
            <div className="font-semibold text-[#f0f6fc]">{tooltipInfo.text}</div>
            {tooltipInfo.subtext && (
              <div className="mt-0.5 text-[11px] text-[#38bdf8] font-mono">{tooltipInfo.subtext}</div>
            )}
          </div>
        )}

        {/* Persistent Transaction Detail Card (Opens on Connection Click) */}
        {selectedTx && (
          <div className="absolute top-4 right-4 z-40 w-full max-w-md rounded-xl border border-[#38bdf8]/50 bg-[#0d1117]/98 p-5 shadow-2xl backdrop-blur-md transition-all sm:max-w-sm">
            <div className="flex items-center justify-between border-b border-[#21262d] pb-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/10 px-2 py-0.5 text-[11px] font-semibold text-cyan-400 border border-cyan-500/20">
                <TrendingUp className="h-3 w-3" />
                {selectedTx.transaction_type}
              </span>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="rounded-md p-1 text-[#8b949e] hover:bg-[#161b22] hover:text-[#f0f6fc] cursor-pointer"
                aria-label="Close transaction details"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              {/* Companies involved */}
              <div className="flex items-center justify-between rounded-lg bg-[#161b22] p-3 border border-[#30363d]">
                <div className="text-left">
                  <div className="text-[10px] uppercase tracking-wider text-[#8b949e]">Investor / Source</div>
                  <div className="font-semibold text-[#f0f6fc]">{selectedTx.source_company}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-[#38bdf8]" />
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wider text-[#8b949e]">Recipient</div>
                  <div className="font-semibold text-[#f0f6fc]">{selectedTx.target_company}</div>
                </div>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-[#161b22]/60 p-2.5 border border-[#21262d]">
                  <div className="text-[10px] uppercase tracking-wider text-[#8b949e]">Disclosed Value</div>
                  <div className="mt-0.5 font-mono text-sm font-bold text-emerald-400">
                    {selectedTx.amount_formatted}
                  </div>
                </div>
                <div className="rounded-lg bg-[#161b22]/60 p-2.5 border border-[#21262d]">
                  <div className="text-[10px] uppercase tracking-wider text-[#8b949e]">Announced</div>
                  <div className="mt-0.5 font-mono text-xs text-[#c9d1d9]">
                    {selectedTx.announcement_date}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <div className="text-[11px] font-semibold text-[#8b949e]">Transaction Summary</div>
                <p className="mt-1 text-xs leading-relaxed text-[#c9d1d9] bg-[#161b22]/30 p-2.5 rounded-md border border-[#21262d]">
                  {selectedTx.description}
                </p>
              </div>

              {/* Source verification */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-[#8b949e]">Verified Primary Source:</span>
                <a
                  href={selectedTx.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#58a6ff] hover:underline"
                >
                  <span>{selectedTx.source_name}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Corresponding ArgonNews Article Link (Requirement 17) */}
              {matchingArticle && (
                <div className="mt-3 rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-cyan-300">
                    <Newspaper className="h-3.5 w-3.5" />
                    ArgonNews Live Coverage Available
                  </div>
                  <div className="mt-1 text-xs font-medium text-[#f0f6fc] line-clamp-2">
                    {matchingArticle.title}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenArticleModal) {
                        onOpenArticleModal(matchingArticle);
                      } else {
                        window.open(matchingArticle.url, '_blank');
                      }
                    }}
                    className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-[#38bdf8] px-3 py-1.5 text-xs font-semibold text-[#080b10] hover:bg-[#7dd3fc] transition-colors cursor-pointer"
                  >
                    <span>Read related coverage →</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Persistent Company Profile Dossier (Opens on Bubble Click) */}
        {selectedCompany && !selectedTx && (
          <div className="absolute top-4 right-4 z-40 w-full max-w-md rounded-xl border border-[#30363d] bg-[#0d1117]/98 p-5 shadow-2xl backdrop-blur-md transition-all sm:max-w-sm">
            <div className="flex items-center justify-between border-b border-[#21262d] pb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-[#38bdf8]" />
                <h3 className="font-serif text-base font-bold text-[#f0f6fc]">
                  {selectedCompany.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCompany(null)}
                className="rounded-md p-1 text-[#8b949e] hover:bg-[#161b22] hover:text-[#f0f6fc] cursor-pointer"
                aria-label="Close company dossier"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#8b949e]">Role in AI Ecosystem</span>
                <p className="mt-0.5 text-xs text-[#c9d1d9]">{selectedCompany.role}</p>
              </div>

              {/* Capital stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-[#161b22] p-2.5 border border-[#21262d]">
                  <div className="text-[10px] uppercase text-[#8b949e]">Capital Deployed</div>
                  <div className="mt-0.5 font-mono text-xs font-bold text-emerald-400">
                    {selectedCompany.total_invested_usd > 0
                      ? `$${(selectedCompany.total_invested_usd / 1e9).toFixed(2)}B`
                      : 'Non-deployer'}
                  </div>
                </div>
                <div className="rounded-lg bg-[#161b22] p-2.5 border border-[#21262d]">
                  <div className="text-[10px] uppercase text-[#8b949e]">Capital Raised</div>
                  <div className="mt-0.5 font-mono text-xs font-bold text-cyan-400">
                    {selectedCompany.total_received_usd > 0
                      ? `$${(selectedCompany.total_received_usd / 1e9).toFixed(2)}B`
                      : 'Self-financed'}
                  </div>
                </div>
              </div>

              {/* Transactions list */}
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#8b949e]">
                  Active Deals ({selectedCompany.transactions_count})
                </span>
                <div className="mt-1 max-h-48 space-y-1.5 overflow-y-auto pr-1">
                  {filteredTransactions
                    .filter(
                      (t) =>
                        t.source_company === selectedCompany.name ||
                        t.target_company === selectedCompany.name
                    )
                    .map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedTx(t)}
                        className="w-full text-left rounded-md border border-[#21262d] bg-[#161b22]/60 p-2 text-[11px] hover:border-[#38bdf8]/50 hover:bg-[#1c2333] transition-all cursor-pointer"
                      >
                        <div className="flex items-center justify-between font-semibold text-[#f0f6fc]">
                          <span>
                            {t.source_company} → {t.target_company}
                          </span>
                          <span className="text-emerald-400 font-mono">{t.amount_formatted}</span>
                        </div>
                        <div className="mt-0.5 text-[10px] text-[#8b949e]">
                          {t.transaction_type} · {t.announcement_date}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Legend */}
        <div className="pointer-events-none absolute bottom-3 left-4 z-20 flex flex-wrap items-center gap-4 text-[11px] text-[#8b949e]">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span>M&A / Acquisitions</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#38bdf8]" />
            <span>Investments & Compute</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Equity Financing</span>
          </div>
        </div>
      </div>
    </div>
  );
};
