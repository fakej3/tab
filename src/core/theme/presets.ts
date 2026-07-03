import { DEFAULT_TOKENS, type ThemeTokens } from './tokens';

export interface ThemePreset {
  id: string;
  name: string;
  tokens: ThemeTokens;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'midnight-glass',
    name: 'Midnight Glass',
    tokens: DEFAULT_TOKENS
  },
  {
    id: 'daybreak',
    name: 'Daybreak',
    tokens: {
      ...DEFAULT_TOKENS,
      accent: '#6d5efc',
      accentContrast: '#ffffff',
      background: '#eef0f6',
      surface: '#0a0a1a',
      surfaceBorder: '#0a0a1a',
      textPrimary: '#15151f',
      textSecondary: 'rgba(21, 21, 31, 0.7)',
      textTertiary: 'rgba(21, 21, 31, 0.46)',
      glassOpacity: 0.55,
      shadowIntensity: 0.12
    }
  },
  {
    id: 'nordic',
    name: 'Nordic',
    tokens: {
      ...DEFAULT_TOKENS,
      accent: '#88c0d0',
      accentContrast: '#0b1620',
      background: '#0e141b',
      textPrimary: '#eceff4',
      glassOpacity: 0.08,
      radius: 14
    }
  },
  {
    id: 'ember',
    name: 'Ember',
    tokens: {
      ...DEFAULT_TOKENS,
      accent: '#ff8a5c',
      accentContrast: '#1a0f0a',
      background: '#120b09',
      glassOpacity: 0.12,
      shadowIntensity: 0.45
    }
  },
  {
    id: 'mono',
    name: 'Mono',
    tokens: {
      ...DEFAULT_TOKENS,
      accent: '#e5e5e5',
      accentContrast: '#0a0a0a',
      background: '#0a0a0a',
      glassOpacity: 0.06,
      radius: 10,
      shadowIntensity: 0.2
    }
  }
];

export function getPreset(id: string): ThemePreset {
  return THEME_PRESETS.find((preset) => preset.id === id) ?? THEME_PRESETS[0]!;
}
