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
      // Surface stays light (not dark) and glassOpacity is pushed high —
      // widgets render as translucent glass *over the wallpaper*, which is
      // independently dark by default and user-controlled. A light surface
      // pairs correctly with dark text regardless of what's behind it; a
      // dark surface would silently break dark-on-dark once composited
      // over a dark wallpaper, which is exactly what shipped here before
      // this was caught in review.
      surface: '#ffffff',
      surfaceBorder: '#0a0a1a',
      textPrimary: '#15151f',
      textSecondary: 'rgba(21, 21, 31, 0.7)',
      textTertiary: 'rgba(21, 21, 31, 0.46)',
      glassOpacity: 0.82,
      shadowIntensity: 0.14,
      // Airy and soft-focus rather than sharply frosted — daylight doesn't
      // need the deep blur a dark theme leans on to feel premium — and the
      // signature rim light is dialed back so it doesn't read as a stray
      // glow against a bright surface.
      radius: 22,
      glassBlur: 20,
      edgeLight: 0.18
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
      radius: 14,
      // Cold and restrained: deeper frost, flatter shadows, a quieter rim
      // light than the default — the opposite mood from Ember's warmth.
      glassBlur: 34,
      shadowIntensity: 0.24,
      edgeLight: 0.2
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
      shadowIntensity: 0.45,
      // Warm and enveloping: rounder surfaces, a stronger accent-lit rim —
      // the one theme that leans into glow rather than restraint.
      radius: 24,
      edgeLight: 0.5
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
      shadowIntensity: 0.2,
      // Graphic and austere: barely any blur (flat, print-like surfaces)
      // and almost no rim light — an achromatic theme shouldn't glow.
      glassBlur: 16,
      edgeLight: 0.05
    }
  }
];

export function getPreset(id: string): ThemePreset {
  return THEME_PRESETS.find((preset) => preset.id === id) ?? THEME_PRESETS[0]!;
}
