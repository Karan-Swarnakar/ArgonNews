import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Sparkles, Maximize2, Minimize2, RotateCcw, Compass, Radio } from 'lucide-react';
import { Article } from '../types';

interface NodeData {
  id: string;
  name: string;
  category: string;
  tag: string;
  description: string;
  color: string;
  glowColor: string;
  xPct: number; // 0..1
  yPct: number; // 0..1
  baseRadius: number;
}

const NODES_CONFIG: NodeData[] = [
  {
    id: 'reasoning',
    name: 'Reasoning & Post-Training',
    category: 'Research',
    tag: 'GRPO / Test-Time Compute',
    description: 'DeepSeek-R1, OpenAI o1/o3, GRPO reinforcement learning algorithms.',
    color: '#fbbf24', // amber
    glowColor: 'rgba(251, 191, 36, 0.5)',
    xPct: 0.22,
    yPct: 0.38,
    baseRadius: 18,
  },
  {
    id: 'frontier-models',
    name: 'Frontier LLMs & Multimodal',
    category: 'Models',
    tag: 'Claude 3.7 / Gemini 2.0',
    description: 'Next-gen foundation architectures, native vision-language reasoning.',
    color: '#38bdf8', // sky
    glowColor: 'rgba(56, 189, 248, 0.5)',
    xPct: 0.48,
    yPct: 0.28,
    baseRadius: 21,
  },
  {
    id: 'open-source',
    name: 'Open Weights & Community',
    category: 'Open Source',
    tag: 'Llama 3.3 / Qwen / Mistral',
    description: 'Permissively licensed models, local inference, Hugging Face ecosystem.',
    color: '#34d399', // emerald
    glowColor: 'rgba(52, 211, 153, 0.5)',
    xPct: 0.76,
    yPct: 0.36,
    baseRadius: 19,
  },
  {
    id: 'compute',
    name: 'Compute Infrastructure',
    category: 'Business',
    tag: 'Blackwell / NVLink / Clusters',
    description: 'NVIDIA GB200, scale-out networking, TPU v6, datacenter megawatts.',
    color: '#a78bfa', // purple
    glowColor: 'rgba(167, 139, 250, 0.5)',
    xPct: 0.35,
    yPct: 0.74,
    baseRadius: 18,
  },
  {
    id: 'agents',
    name: 'Autonomous Agentic Systems',
    category: 'Models',
    tag: 'Computer-Use / Workflows',
    description: 'Multi-turn planning, browser execution, coding assistants.',
    color: '#f472b6', // pink
    glowColor: 'rgba(244, 114, 182, 0.5)',
    xPct: 0.64,
    yPct: 0.72,
    baseRadius: 17,
  },
  {
    id: 'safety',
    name: 'Safety, Alignment & Governance',
    category: 'Safety & Policy',
    tag: 'Mechanistic Interpretability',
    description: 'Constitutional AI, red-teaming, EU AI Act, risk benchmarks.',
    color: '#f87171', // red/rose
    glowColor: 'rgba(248, 113, 113, 0.5)',
    xPct: 0.82,
    yPct: 0.65,
    baseRadius: 16,
  },
];

// Edges between related nodes
const EDGES: [string, string][] = [
  ['reasoning', 'frontier-models'],
  ['frontier-models', 'open-source'],
  ['reasoning', 'compute'],
  ['frontier-models', 'compute'],
  ['frontier-models', 'agents'],
  ['open-source', 'agents'],
  ['frontier-models', 'safety'],
  ['agents', 'safety'],
  ['compute', 'agents'],
  ['reasoning', 'open-source'],
];

interface Particle {
  edgeIndex: number;
  progress: number; // 0..1
  speed: number;
  size: number;
  color: string;
}

interface NodeState {
  config: NodeData;
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  vx: number;
  vy: number;
  radius: number;
  currentRadius: number;
  isHovered: boolean;
  isDragged: boolean;
  phase: number;
}

interface AIEcosystemDoodleProps {
  articles: Article[];
  onSelectCategory?: (category: string) => void;
  onSearchTopic?: (topic: string) => void;
  activeCategory?: string;
}

export const AIEcosystemDoodle: React.FC<AIEcosystemDoodleProps> = ({
  articles,
  onSelectCategory,
  onSearchTopic,
  activeCategory,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [hoveredNode, setHoveredNode] = useState<NodeData | null>(null);
  const [activeArticlesCount, setActiveArticlesCount] = useState<Record<string, number>>({});

  // Compute live dispatch count for each node
  useEffect(() => {
    const counts: Record<string, number> = {};
    for (const node of NODES_CONFIG) {
      let c = 0;
      for (const a of articles) {
        const cat = a.category || a.analysis?.category || '';
        const t = `${a.title} ${a.content || ''} ${a.analysis?.summary || ''}`.toLowerCase();
        if (cat.toLowerCase() === node.category.toLowerCase()) {
          c++;
        } else if (
          (node.id === 'reasoning' && (t.includes('reasoning') || t.includes('deepseek') || t.includes('o1') || t.includes('grpo'))) ||
          (node.id === 'compute' && (t.includes('gpu') || t.includes('blackwell') || t.includes('nvidia') || t.includes('compute'))) ||
          (node.id === 'agents' && (t.includes('agent') || t.includes('workflow') || t.includes('autonomous'))) ||
          (node.id === 'open-source' && (t.includes('open source') || t.includes('llama') || t.includes('qwen') || t.includes('mistral')))
        ) {
          c++;
        }
      }
      counts[node.id] = c;
    }
    setActiveArticlesCount(counts);
  }, [articles]);

  // Main Canvas & Physics Engine Ref
  const engineRef = useRef<{
    nodes: NodeState[];
    particles: Particle[];
    width: number;
    height: number;
    mouse: { x: number; y: number; isDown: boolean; targetNode: NodeState | null };
    animId: number | null;
    isVisible: boolean;
    reducedMotion: boolean;
    pulseRings: { x: number; y: number; radius: number; maxRadius: number; alpha: number; color: string }[];
  }>({
    nodes: [],
    particles: [],
    width: 0,
    height: 0,
    mouse: { x: -1000, y: -1000, isDown: false, targetNode: null },
    animId: null,
    isVisible: true,
    reducedMotion: false,
    pulseRings: [],
  });

  // Pulse animation trigger
  const triggerPulseWave = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || engine.width === 0) return;
    const centerX = engine.width / 2;
    const centerY = engine.height / 2;
    engine.pulseRings.push({
      x: centerX,
      y: centerY,
      radius: 10,
      maxRadius: Math.max(engine.width, engine.height) * 0.75,
      alpha: 0.8,
      color: '#fbbf24',
    });
  }, []);

  // Initialize and run Canvas Animation Loop
  useEffect(() => {
    if (isCollapsed) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const engine = engineRef.current;
    engine.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Build Node State
    const initNodes = () => {
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height || 260;
      engine.width = width;
      engine.height = height;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);

      engine.nodes = NODES_CONFIG.map((config, idx) => {
        const homeX = config.xPct * width;
        const homeY = config.yPct * height;
        return {
          config,
          x: homeX,
          y: homeY,
          homeX,
          homeY,
          vx: 0,
          vy: 0,
          radius: config.baseRadius,
          currentRadius: config.baseRadius,
          isHovered: false,
          isDragged: false,
          phase: idx * 1.2,
        };
      });

      // Build Particles
      engine.particles = [];
      for (let i = 0; i < 22; i++) {
        const edgeIndex = i % EDGES.length;
        engine.particles.push({
          edgeIndex,
          progress: Math.random(),
          speed: 0.003 + Math.random() * 0.004,
          size: 1.5 + Math.random() * 1.5,
          color: i % 2 === 0 ? '#38bdf8' : '#fbbf24',
        });
      }
    };

    initNodes();

    // Resize Observer
    const resizeObserver = new ResizeObserver(() => {
      initNodes();
    });
    resizeObserver.observe(container);

    // Visibility Observer (pauses rAF when scrolled offscreen)
    const intersectionObserver = new IntersectionObserver((entries) => {
      const entry = entries[0];
      engine.isVisible = entry ? entry.isIntersecting : true;
    });
    intersectionObserver.observe(container);

    // Mouse / Touch Event Handlers
    const getCoords = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      if ('touches' in e && e.touches.length > 0) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
      } else if ('clientX' in e) {
        return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }
      return { x: -1000, y: -1000 };
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const { x, y } = getCoords(e);
      engine.mouse.x = x;
      engine.mouse.y = y;

      if (engine.mouse.isDown && engine.mouse.targetNode) {
        engine.mouse.targetNode.x = x;
        engine.mouse.targetNode.y = y;
        engine.mouse.targetNode.vx = 0;
        engine.mouse.targetNode.vy = 0;
        return;
      }

      // Check hover
      let found: NodeState | null = null;
      for (const node of engine.nodes) {
        const dist = Math.hypot(node.x - x, node.y - y);
        if (dist < node.radius + 12) {
          found = node;
          break;
        }
      }

      let newlyHovered: NodeData | null = null;
      engine.nodes.forEach((n) => {
        if (found && n.config.id === found.config.id) {
          n.isHovered = true;
          newlyHovered = n.config;
        } else {
          n.isHovered = false;
        }
      });
      setHoveredNode(newlyHovered);
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const { x, y } = getCoords(e);
      engine.mouse.isDown = true;

      for (const node of engine.nodes) {
        const dist = Math.hypot(node.x - x, node.y - y);
        if (dist < node.radius + 14) {
          engine.mouse.targetNode = node;
          node.isDragged = true;
          break;
        }
      }
    };

    const handlePointerUp = (e: MouseEvent | TouchEvent) => {
      const { x, y } = getCoords(e);
      if (engine.mouse.targetNode) {
        // If release was basically a tap/click, trigger filter
        const node = engine.mouse.targetNode;
        const moved = Math.hypot(node.x - node.homeX, node.y - node.homeY);
        if (moved < 25 && onSelectCategory) {
          onSelectCategory(node.config.category);
        }
        node.isDragged = false;
        engine.mouse.targetNode = null;
      }
      engine.mouse.isDown = false;
    };

    const handlePointerLeave = () => {
      engine.mouse.x = -1000;
      engine.mouse.y = -1000;
      engine.mouse.isDown = false;
      if (engine.mouse.targetNode) {
        engine.mouse.targetNode.isDragged = false;
        engine.mouse.targetNode = null;
      }
      engine.nodes.forEach((n) => (n.isHovered = false));
      setHoveredNode(null);
    };

    canvas.addEventListener('mousemove', handlePointerMove);
    canvas.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mouseup', handlePointerUp);
    canvas.addEventListener('mouseleave', handlePointerLeave);

    canvas.addEventListener('touchmove', handlePointerMove, { passive: true });
    canvas.addEventListener('touchstart', handlePointerDown, { passive: true });
    window.addEventListener('touchend', handlePointerUp);

    // Physics & Render Loop
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      if (engine.isVisible && !engine.reducedMotion) {
        ctx.clearRect(0, 0, engine.width, engine.height);

        // 1. Draw Subtle Grid Background Dots
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        const step = 28;
        for (let gx = 14; gx < engine.width; gx += step) {
          for (let gy = 14; gy < engine.height; gy += step) {
            ctx.fillRect(gx, gy, 1, 1);
          }
        }

        // 2. Update & Draw Pulse Waves
        for (let i = engine.pulseRings.length - 1; i >= 0; i--) {
          const ring = engine.pulseRings[i];
          ring.radius += 200 * dt;
          ring.alpha *= 0.96;
          if (ring.radius > ring.maxRadius || ring.alpha < 0.02) {
            engine.pulseRings.splice(i, 1);
            continue;
          }
          ctx.beginPath();
          ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(251, 191, 36, ${ring.alpha.toFixed(2)})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        // 3. Update Node Physics
        const nodeMap = new Map<string, NodeState>();
        engine.nodes.forEach((n) => {
          nodeMap.set(n.config.id, n);

          if (!n.isDragged) {
            // Harmonic floating
            const floatAmpX = 7;
            const floatAmpY = 5;
            const floatTargetX = n.homeX + Math.sin(time * 0.0015 + n.phase) * floatAmpX;
            const floatTargetY = n.homeY + Math.cos(time * 0.0012 + n.phase) * floatAmpY;

            // Spring force towards target
            const k = 5.0; // spring stiffness
            const d = 0.85; // damping
            const fx = (floatTargetX - n.x) * k;
            const fy = (floatTargetY - n.y) * k;

            // Gravitational lens deflection from mouse cursor
            const mouseDist = Math.hypot(engine.mouse.x - n.x, engine.mouse.y - n.y);
            let repelX = 0;
            let repelY = 0;
            if (mouseDist > 0 && mouseDist < 120) {
              const force = (1 - mouseDist / 120) * 40;
              repelX = ((n.x - engine.mouse.x) / mouseDist) * force;
              repelY = ((n.y - engine.mouse.y) / mouseDist) * force;
            }

            n.vx = (n.vx + (fx + repelX) * dt) * d;
            n.vy = (n.vy + (fy + repelY) * dt) * d;

            n.x += n.vx * dt * 60;
            n.y += n.vy * dt * 60;
          }

          // Smooth radius expansion on hover
          const targetRad = n.isHovered ? n.radius + 6 : n.radius;
          n.currentRadius += (targetRad - n.currentRadius) * 0.2;
        });

        // 4. Draw Network Connections
        EDGES.forEach(([srcId, dstId]) => {
          const src = nodeMap.get(srcId);
          const dst = nodeMap.get(dstId);
          if (!src || !dst) return;

          const isConnectedHovered = src.isHovered || dst.isHovered;

          ctx.beginPath();
          ctx.moveTo(src.x, src.y);
          ctx.lineTo(dst.x, dst.y);

          if (isConnectedHovered) {
            ctx.strokeStyle = 'rgba(251, 191, 36, 0.45)';
            ctx.lineWidth = 1.8;
          } else {
            ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
            ctx.lineWidth = 1.0;
          }
          ctx.stroke();
        });

        // 5. Draw Information Packet Particles
        engine.particles.forEach((p) => {
          p.progress += p.speed;
          if (p.progress > 1) p.progress = 0;

          const edge = EDGES[p.edgeIndex];
          if (!edge) return;
          const src = nodeMap.get(edge[0]);
          const dst = nodeMap.get(edge[1]);
          if (!src || !dst) return;

          const px = src.x + (dst.x - src.x) * p.progress;
          const py = src.y + (dst.y - src.y) * p.progress;

          ctx.beginPath();
          ctx.arc(px, py, p.size, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 6;
          ctx.fill();
          ctx.shadowBlur = 0;
        });

        // 6. Draw Nodes
        engine.nodes.forEach((n) => {
          const isSelected = activeCategory?.toLowerCase() === n.config.category.toLowerCase();

          // Outer Glow
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.currentRadius + 4, 0, Math.PI * 2);
          ctx.fillStyle = n.isHovered || isSelected ? n.config.glowColor : 'rgba(255, 255, 255, 0.05)';
          ctx.fill();

          // Main Node Body
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.currentRadius, 0, Math.PI * 2);
          ctx.fillStyle = '#0d1117';
          ctx.fill();
          ctx.lineWidth = n.isHovered || isSelected ? 2.5 : 1.5;
          ctx.strokeStyle = n.config.color;
          ctx.stroke();

          // Center Core Dot
          ctx.beginPath();
          ctx.arc(n.x, n.y, n.isHovered ? 5 : 3.5, 0, Math.PI * 2);
          ctx.fillStyle = n.config.color;
          ctx.fill();

          // Node Label
          ctx.font = '600 11px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = n.isHovered ? '#ffffff' : '#cbd5e1';
          ctx.fillText(n.config.name, n.x, n.y + n.currentRadius + 15);

          // Sub-badge (tag)
          ctx.font = '400 9px monospace';
          ctx.fillStyle = '#64748b';
          ctx.fillText(n.config.tag, n.x, n.y + n.currentRadius + 26);
        });
      }

      engine.animId = requestAnimationFrame(render);
    };

    // If reduced motion is requested, render once cleanly and do not loop
    if (engine.reducedMotion) {
      ctx.clearRect(0, 0, engine.width, engine.height);
      const nodeMap = new Map<string, NodeState>();
      engine.nodes.forEach((n) => {
        nodeMap.set(n.config.id, n);
      });
      EDGES.forEach(([srcId, dstId]) => {
        const src = nodeMap.get(srcId);
        const dst = nodeMap.get(dstId);
        if (src && dst) {
          ctx.beginPath();
          ctx.moveTo(src.x, src.y);
          ctx.lineTo(dst.x, dst.y);
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }
      });
      engine.nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#0d1117';
        ctx.fill();
        ctx.strokeStyle = n.config.color;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.font = '600 11px sans-serif';
        ctx.fillStyle = '#f1f5f9';
        ctx.textAlign = 'center';
        ctx.fillText(n.config.name, n.x, n.y + n.radius + 16);
      });
    } else {
      engine.animId = requestAnimationFrame(render);
    }

    return () => {
      if (engine.animId) cancelAnimationFrame(engine.animId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener('mousemove', handlePointerMove);
      canvas.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mouseup', handlePointerUp);
      canvas.removeEventListener('mouseleave', handlePointerLeave);
      canvas.removeEventListener('touchmove', handlePointerMove);
      canvas.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchend', handlePointerUp);
    };
  }, [isCollapsed, onSelectCategory, activeCategory]);

  return (
    <div className="relative mb-6 rounded-lg border border-[#22272e] bg-[#0c0e12] overflow-hidden transition-all">
      {/* Top Banner Controls */}
      <div className="flex items-center justify-between border-b border-[#1c2128] bg-[#090b0e] px-3.5 py-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Compass className="h-3 w-3 animate-spin-slow" />
          </div>
          <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#cbd5e1]">
            Interactive Frontier Constellation
          </span>
          <span className="hidden sm:inline-block rounded bg-[#161b22] px-1.5 py-0.5 font-mono text-[10px] text-[#8b949e] border border-[#2d333b]">
            Doodle Engine 2.1
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={triggerPulseWave}
            className="flex items-center gap-1 rounded bg-[#161b22] px-2 py-1 text-[11px] font-medium text-[#94a3b8] hover:bg-[#21262d] hover:text-[#f0f6fc] border border-[#30363d] transition-colors cursor-pointer"
            title="Trigger energetic neural pulse across the network"
          >
            <Radio className="h-3 w-3 text-amber-400" />
            <span className="hidden sm:inline">Pulse Field</span>
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-1 rounded bg-[#161b22] px-2 py-1 text-[11px] font-medium text-[#94a3b8] hover:bg-[#21262d] hover:text-[#f0f6fc] border border-[#30363d] transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand constellation' : 'Minimize constellation'}
          >
            {isCollapsed ? (
              <>
                <Maximize2 className="h-3 w-3" />
                <span className="hidden sm:inline">Expand Visual</span>
              </>
            ) : (
              <>
                <Minimize2 className="h-3 w-3" />
                <span className="hidden sm:inline">Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      {!isCollapsed && (
        <div ref={containerRef} className="relative w-full h-[260px] sm:h-[280px] bg-[#0c0e12] select-none touch-none">
          <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block cursor-grab active:cursor-grabbing" />

          {/* Floating Editorial HUD on Hover */}
          {hoveredNode && (
            <div className="pointer-events-none absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-md rounded-md border border-[#30363d] bg-[#14171d]/95 backdrop-blur px-3.5 py-2.5 shadow-xl text-xs z-10 animate-in fade-in duration-150">
              <div className="flex items-center justify-between gap-2 border-b border-[#22272e] pb-1.5 mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: hoveredNode.color, boxShadow: `0 0 8px ${hoveredNode.color}` }}
                  />
                  <span className="font-semibold text-[#f0f6fc] font-sans text-xs">{hoveredNode.name}</span>
                </div>
                <span className="font-mono text-[10px] text-amber-400 font-medium">
                  {activeArticlesCount[hoveredNode.id] ?? 0} Dispatches
                </span>
              </div>
              <p className="text-[11px] text-[#94a3b8] leading-relaxed">{hoveredNode.description}</p>
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#64748b]">
                <span>Desk: <strong className="text-[#cbd5e1]">{hoveredNode.category}</strong></span>
                <span className="text-amber-300/80">Click node to filter feed</span>
              </div>
            </div>
          )}

          {/* Bottom-right interactive hint */}
          <div className="pointer-events-none absolute bottom-2 right-3 text-[10px] font-mono text-[#64748b] hidden md:block">
            <span>Drag nodes • Hover for intelligence • Click to filter</span>
          </div>
        </div>
      )}
    </div>
  );
};
