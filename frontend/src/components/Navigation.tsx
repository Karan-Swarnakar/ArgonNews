import React from 'react';
import { CategoryFilter } from '../types';
import { Sparkles, BookOpen, Cpu, GitBranch, Briefcase, ShieldAlert, Layers } from 'lucide-react';

interface NavigationProps {
  currentCategory: CategoryFilter;
  onSelectCategory: (category: CategoryFilter) => void;
  categoryCounts: Record<string, number>;
}

const CATEGORY_ITEMS: { id: CategoryFilter; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'Today', label: 'Today', icon: Sparkles },
  { id: 'Research', label: 'Research', icon: BookOpen },
  { id: 'Models', label: 'Models', icon: Cpu },
  { id: 'Open Source', label: 'Open Source', icon: GitBranch },
  { id: 'Business', label: 'Business', icon: Briefcase },
  { id: 'Safety & Policy', label: 'Safety & Policy', icon: ShieldAlert },
  { id: 'All', label: 'All Articles', icon: Layers },
];

export const Navigation: React.FC<NavigationProps> = ({
  currentCategory,
  onSelectCategory,
  categoryCounts,
}) => {
  return (
    <nav className="border-b border-slate-800/60 bg-slate-950/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 overflow-x-auto py-2.5 no-scrollbar">
          {CATEGORY_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentCategory === item.id;
            const count = categoryCounts[item.id] ?? (item.id === 'All' ? (Object.values(categoryCounts) as number[]).reduce((a, b) => a + b, 0) : undefined);

            return (
              <button
                key={item.id}
                id={`nav-category-${item.id.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={() => onSelectCategory(item.id)}
                className={`group flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? 'border border-cyan-500/40 bg-cyan-950/40 text-cyan-200 shadow-sm shadow-cyan-950/50'
                    : 'border border-transparent text-slate-400 hover:border-slate-800 hover:bg-slate-900/60 hover:text-slate-200'
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 transition-colors ${
                    isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-400'
                  }`}
                />
                <span>{item.label}</span>
                {typeof count === 'number' && count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono leading-tight ${
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                        : 'bg-slate-800/80 text-slate-500 group-hover:text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
