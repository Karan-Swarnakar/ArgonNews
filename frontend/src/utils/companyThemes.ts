/**
 * Shared color palettes and visual styling for AI Ecosystem & Money Flow visualizations.
 * Provides high-contrast, vibrant, recognizable identities for frontier companies and tiers.
 */

export interface CompanyTheme {
  color: string;      // Vibrant primary accent
  glow: string;       // Radiant active glow
  glowDim: string;    // Ambient idle glow
  tint: string;       // Inner radial disk wash
  border: string;     // Crisp outer border ring
  text: string;       // Crisp label color
}

export const COMPANY_THEMES: Record<string, CompanyTheme> = {
  'NVIDIA': {
    color: '#10b981', // Emerald
    glow: 'rgba(16, 185, 129, 0.55)',
    glowDim: 'rgba(16, 185, 129, 0.16)',
    tint: 'rgba(6, 78, 59, 0.50)',
    border: '#34d399',
    text: '#ffffff',
  },
  'Microsoft': {
    color: '#0ea5e9', // Azure sky
    glow: 'rgba(14, 165, 233, 0.55)',
    glowDim: 'rgba(14, 165, 233, 0.16)',
    tint: 'rgba(12, 74, 110, 0.50)',
    border: '#38bdf8',
    text: '#ffffff',
  },
  'OpenAI': {
    color: '#14b8a6', // Teal
    glow: 'rgba(20, 184, 166, 0.55)',
    glowDim: 'rgba(20, 184, 166, 0.16)',
    tint: 'rgba(19, 78, 74, 0.50)',
    border: '#2dd4bf',
    text: '#ffffff',
  },
  'Anthropic': {
    color: '#f59e0b', // Amber / warm gold
    glow: 'rgba(245, 158, 11, 0.55)',
    glowDim: 'rgba(245, 158, 11, 0.16)',
    tint: 'rgba(120, 53, 15, 0.50)',
    border: '#fbbf24',
    text: '#ffffff',
  },
  'Amazon / AWS': {
    color: '#f97316', // Orange
    glow: 'rgba(249, 115, 22, 0.55)',
    glowDim: 'rgba(249, 115, 22, 0.16)',
    tint: 'rgba(124, 45, 18, 0.50)',
    border: '#fb923c',
    text: '#ffffff',
  },
  'Hugging Face': {
    color: '#eab308', // Warm yellow
    glow: 'rgba(234, 179, 8, 0.55)',
    glowDim: 'rgba(234, 179, 8, 0.16)',
    tint: 'rgba(113, 63, 18, 0.50)',
    border: '#facc15',
    text: '#ffffff',
  },
  'Google / Alphabet': {
    color: '#f43f5e', // Vibrant coral rose
    glow: 'rgba(244, 63, 94, 0.55)',
    glowDim: 'rgba(244, 63, 94, 0.16)',
    tint: 'rgba(136, 19, 55, 0.50)',
    border: '#fb7185',
    text: '#ffffff',
  },
  'DeepSeek': {
    color: '#06b6d4', // Bright cyan
    glow: 'rgba(6, 182, 212, 0.55)',
    glowDim: 'rgba(6, 182, 212, 0.16)',
    tint: 'rgba(22, 78, 99, 0.50)',
    border: '#22d3ee',
    text: '#ffffff',
  },
  'xAI': {
    color: '#a855f7', // Electric purple
    glow: 'rgba(168, 85, 247, 0.55)',
    glowDim: 'rgba(168, 85, 247, 0.16)',
    tint: 'rgba(88, 28, 135, 0.50)',
    border: '#c084fc',
    text: '#ffffff',
  },
  'Meta': {
    color: '#6366f1', // Indigo
    glow: 'rgba(99, 102, 241, 0.55)',
    glowDim: 'rgba(99, 102, 241, 0.16)',
    tint: 'rgba(49, 46, 129, 0.50)',
    border: '#818cf8',
    text: '#ffffff',
  },
  'Mistral': {
    color: '#ec4899', // Fuchsia / Pink
    glow: 'rgba(236, 72, 153, 0.55)',
    glowDim: 'rgba(236, 72, 153, 0.16)',
    tint: 'rgba(131, 24, 67, 0.50)',
    border: '#f472b6',
    text: '#ffffff',
  },
  'Oracle': {
    color: '#ef4444', // Red
    glow: 'rgba(239, 68, 68, 0.55)',
    glowDim: 'rgba(239, 68, 68, 0.16)',
    tint: 'rgba(127, 29, 29, 0.50)',
    border: '#f87171',
    text: '#ffffff',
  },
  'Scale AI': {
    color: '#8b5cf6', // Violet
    glow: 'rgba(139, 92, 246, 0.55)',
    glowDim: 'rgba(139, 92, 246, 0.16)',
    tint: 'rgba(76, 29, 149, 0.50)',
    border: '#a78bfa',
    text: '#ffffff',
  },
  'Databricks': {
    color: '#fb923c', // Flame Orange
    glow: 'rgba(251, 146, 60, 0.55)',
    glowDim: 'rgba(251, 146, 60, 0.16)',
    tint: 'rgba(154, 52, 18, 0.50)',
    border: '#fdba74',
    text: '#ffffff',
  },
};

export function getCompanyTheme(name: string, tier?: string): CompanyTheme {
  if (COMPANY_THEMES[name]) {
    return COMPANY_THEMES[name];
  }

  // Tier-based fallbacks
  if (tier === 'hardware') {
    return {
      color: '#10b981',
      glow: 'rgba(16, 185, 129, 0.55)',
      glowDim: 'rgba(16, 185, 129, 0.16)',
      tint: 'rgba(6, 78, 59, 0.50)',
      border: '#34d399',
      text: '#ffffff',
    };
  }
  if (tier === 'frontier-lab') {
    return {
      color: '#0ea5e9',
      glow: 'rgba(14, 165, 233, 0.55)',
      glowDim: 'rgba(14, 165, 233, 0.16)',
      tint: 'rgba(12, 74, 110, 0.50)',
      border: '#38bdf8',
      text: '#ffffff',
    };
  }
  if (tier === 'hyperscaler') {
    return {
      color: '#f59e0b',
      glow: 'rgba(245, 158, 11, 0.55)',
      glowDim: 'rgba(245, 158, 11, 0.16)',
      tint: 'rgba(120, 53, 15, 0.50)',
      border: '#fbbf24',
      text: '#ffffff',
    };
  }
  if (tier === 'infrastructure') {
    return {
      color: '#a855f7',
      glow: 'rgba(168, 85, 247, 0.55)',
      glowDim: 'rgba(168, 85, 247, 0.16)',
      tint: 'rgba(88, 28, 135, 0.50)',
      border: '#c084fc',
      text: '#ffffff',
    };
  }

  // Default vibrant cyan
  return {
    color: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.55)',
    glowDim: 'rgba(56, 189, 248, 0.16)',
    tint: 'rgba(14, 116, 144, 0.50)',
    border: '#7dd3fc',
    text: '#ffffff',
  };
}
