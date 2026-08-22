import React from 'react';
import { Cpu, Network, ShieldCheck, Terminal, Bot, FlaskConical, TrendingUp, Sparkles } from 'lucide-react';

interface CategoryVisualFallbackProps {
  category?: string;
  className?: string;
  title?: string;
}

export const CategoryVisualFallback: React.FC<CategoryVisualFallbackProps> = ({
  category = 'GENERAL',
  className = '',
  title = '',
}) => {
  const normCat = (category || '').toUpperCase();

  const getCategoryConfig = () => {
    switch (normCat) {
      case 'MODEL':
      case 'MODELS':
        return {
          icon: Network,
          label: 'Foundation Models',
          sub: 'Neural Architecture',
          accent: '#60a5fa',
          pattern: (
            <g stroke="#3b82f6" strokeWidth="0.7" opacity="0.35" fill="none">
              <circle cx="30" cy="35" r="4" fill="#3b82f6" fillOpacity="0.4" />
              <circle cx="80" cy="20" r="3" fill="#3b82f6" fillOpacity="0.4" />
              <circle cx="80" cy="50" r="3" fill="#3b82f6" fillOpacity="0.4" />
              <circle cx="130" cy="35" r="4" fill="#3b82f6" fillOpacity="0.4" />
              <line x1="30" y1="35" x2="80" y2="20" />
              <line x1="30" y1="35" x2="80" y2="50" />
              <line x1="80" y1="20" x2="130" y2="35" />
              <line x1="80" y1="50" x2="130" y2="35" />
              <circle cx="180" cy="25" r="3" fill="#3b82f6" fillOpacity="0.3" />
              <circle cx="180" cy="45" r="3" fill="#3b82f6" fillOpacity="0.3" />
              <line x1="130" y1="35" x2="180" y2="25" />
              <line x1="130" y1="35" x2="180" y2="45" />
            </g>
          ),
        };
      case 'RESEARCH':
        return {
          icon: FlaskConical,
          label: 'Scientific Research',
          sub: 'Empirical Theory',
          accent: '#c084fc',
          pattern: (
            <g stroke="#a855f7" strokeWidth="0.7" opacity="0.35" fill="none">
              <polygon points="100,15 140,40 140,80 100,105 60,80 60,40" />
              <polygon points="100,30 125,45 125,75 100,90 75,75 75,45" />
              <line x1="100" y1="15" x2="100" y2="30" />
              <line x1="140" y1="40" x2="125" y2="45" />
              <line x1="140" y1="80" x2="125" y2="75" />
              <line x1="100" y1="105" x2="100" y2="90" />
              <line x1="60" y1="80" x2="75" y2="75" />
              <line x1="60" y1="40" x2="75" y2="45" />
            </g>
          ),
        };
      case 'HARDWARE':
        return {
          icon: Cpu,
          label: 'Silicon & Compute',
          sub: 'Processor Architecture',
          accent: '#34d399',
          pattern: (
            <g stroke="#10b981" strokeWidth="0.8" opacity="0.35" fill="none">
              <rect x="50" y="20" width="100" height="70" rx="3" strokeDasharray="3 3" />
              <rect x="70" y="35" width="60" height="40" rx="2" fill="#10b981" fillOpacity="0.1" />
              <line x1="70" y1="20" x2="70" y2="35" />
              <line x1="100" y1="20" x2="100" y2="35" />
              <line x1="130" y1="20" x2="130" y2="35" />
              <line x1="70" y1="75" x2="70" y2="90" />
              <line x1="100" y1="75" x2="100" y2="90" />
              <line x1="130" y1="75" x2="130" y2="90" />
              <line x1="50" y1="45" x2="70" y2="45" />
              <line x1="50" y1="65" x2="70" y2="65" />
              <line x1="130" y1="45" x2="150" y2="45" />
              <line x1="130" y1="65" x2="150" y2="65" />
            </g>
          ),
        };
      case 'OPEN_SOURCE':
        return {
          icon: Terminal,
          label: 'Open Source',
          sub: 'Repository Architecture',
          accent: '#38bdf8',
          pattern: (
            <g stroke="#0ea5e9" strokeWidth="0.8" opacity="0.35" fill="none">
              <path d="M40 30 L65 55 L40 80" />
              <line x1="75" y1="80" x2="110" y2="80" strokeWidth="1.5" />
              <circle cx="140" cy="35" r="4" fill="#0ea5e9" fillOpacity="0.4" />
              <circle cx="160" cy="55" r="4" fill="#0ea5e9" fillOpacity="0.4" />
              <circle cx="140" cy="75" r="4" fill="#0ea5e9" fillOpacity="0.4" />
              <line x1="140" y1="35" x2="140" y2="75" />
              <path d="M140 35 C155 35 155 55 160 55" />
            </g>
          ),
        };
      case 'POLICY':
      case 'ETHICS':
        return {
          icon: ShieldCheck,
          label: 'AI Safety & Policy',
          sub: 'Governance & Alignment',
          accent: '#fbbf24',
          pattern: (
            <g stroke="#f59e0b" strokeWidth="0.8" opacity="0.35" fill="none">
              <path d="M100 20 L145 35 V65 C145 90 100 105 100 105 C100 105 55 90 55 65 V35 Z" />
              <path d="M100 35 L130 45 V65 C130 82 100 93 100 93 C100 93 70 82 70 65 V45 Z" fill="#f59e0b" fillOpacity="0.1" />
              <line x1="100" y1="45" x2="100" y2="80" strokeDasharray="2 2" />
            </g>
          ),
        };
      case 'ROBOTICS':
        return {
          icon: Bot,
          label: 'Robotics & Embodied',
          sub: 'Kinematic Actuation',
          accent: '#f87171',
          pattern: (
            <g stroke="#ef4444" strokeWidth="0.8" opacity="0.35" fill="none">
              <circle cx="60" cy="80" r="10" />
              <line x1="60" y1="70" x2="100" y2="40" strokeWidth="1.5" />
              <circle cx="100" cy="40" r="7" fill="#ef4444" fillOpacity="0.3" />
              <line x1="100" y1="40" x2="145" y2="60" strokeWidth="1.5" />
              <circle cx="145" cy="60" r="5" fill="#ef4444" fillOpacity="0.3" />
              <path d="M145 60 L160 50 M145 60 L160 70" strokeWidth="1.2" />
            </g>
          ),
        };
      case 'INDUSTRY':
        return {
          icon: TrendingUp,
          label: 'Enterprise & Market',
          sub: 'Commercial Operations',
          accent: '#94a3b8',
          pattern: (
            <g stroke="#64748b" strokeWidth="0.8" opacity="0.35" fill="none">
              <line x1="40" y1="90" x2="160" y2="90" />
              <line x1="40" y1="30" x2="40" y2="90" />
              <path d="M40 75 L75 60 L110 70 L155 35" strokeWidth="1.5" stroke="#94a3b8" />
              <circle cx="75" cy="60" r="3" fill="#94a3b8" />
              <circle cx="110" cy="70" r="3" fill="#94a3b8" />
              <circle cx="155" cy="35" r="3" fill="#94a3b8" />
            </g>
          ),
        };
      default:
        return {
          icon: Sparkles,
          label: 'ArgonNews Dispatch',
          sub: 'Artificial Intelligence',
          accent: '#cbd5e1',
          pattern: (
            <g stroke="#475569" strokeWidth="0.7" opacity="0.35" fill="none">
              <circle cx="100" cy="55" r="35" strokeDasharray="3 3" />
              <circle cx="100" cy="55" r="20" />
              <line x1="50" y1="55" x2="150" y2="55" />
              <line x1="100" y1="10" x2="100" y2="100" />
            </g>
          ),
        };
    }
  };

  const config = getCategoryConfig();
  const Icon = config.icon;

  return (
    <div
      className={`relative w-full h-full min-h-[140px] bg-[#0d1015] border border-[#21262d] flex flex-col justify-between p-3.5 select-none overflow-hidden ${className}`}
      role="img"
      aria-label={`ArgonNews visual graphic for ${config.label}`}
    >
      {/* Background SVG Grid & Thematic Schematic */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 200 110"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id={`grid-pattern-${normCat}`} width="20" height="20" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="20" y2="0" stroke="#1c2128" strokeWidth="0.5" />
            <line x1="0" y1="0" x2="0" y2="20" stroke="#1c2128" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-pattern-${normCat})`} />
        {config.pattern}
      </svg>

      {/* Top Header Tag */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#8b949e]">
          <Icon className="h-3.5 w-3.5 text-[#cbd5e1]" />
          <span>{config.label}</span>
        </div>
        <span className="font-mono text-[9px] text-[#484f58] tracking-widest uppercase">
          ArgonNews
        </span>
      </div>

      {/* Center abstract schematic indicator */}
      <div className="relative z-10 my-auto text-center py-2">
        <span className="font-mono text-[11px] text-[#cbd5e1] tracking-tight block">
          {config.sub}
        </span>
        {title && (
          <span className="font-serif text-[12px] text-[#8b949e] line-clamp-1 italic px-2 mt-0.5">
            "{title}"
          </span>
        )}
      </div>

      {/* Bottom Technical Footer */}
      <div className="relative z-10 flex items-center justify-between border-t border-[#21262d] pt-1.5 font-mono text-[9px] text-[#6e7681]">
        <span>ARGON INTEL DESK</span>
        <span>VERIFIED VISUAL</span>
      </div>
    </div>
  );
};
