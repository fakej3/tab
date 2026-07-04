/**
 * The full set of theme tokens. Every color/surface value the UI renders
 * must resolve through one of these — nothing is ever hardcoded in a
 * plugin's CSS. Each token maps 1:1 to a CSS custom property (`--ws-*`)
 * that ThemeEngine writes onto `:root`.
 */
export interface ThemeTokens {
  accent: string;
  accentContrast: string;
  background: string;
  surface: string;
  surfaceBorder: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  /** Text color for content that sits directly on the wallpaper (the hero
   *  clock, the quiet quote line) rather than on a glass/solid surface.
   *  Deliberately NOT the same dial as textPrimary: the wallpaper is set
   *  completely independently of the theme, so a theme that flips
   *  textPrimary to a dark color for light glass surfaces must not also
   *  flip this — that would put dark text on the (still dark by default)
   *  wallpaper with no surface behind it to justify the flip. */
  onWallpaper: string;
  onWallpaperSecondary: string;
  success: string;
  warning: string;
  danger: string;
  /** Base corner radius in px; widgets/controls derive sm/md/lg from this. */
  radius: number;
  /** Glass blur amount in px applied to translucent surfaces. */
  glassBlur: number;
  /** Opacity (0-1) of glass surface fill. */
  glassOpacity: number;
  /** Multiplier (0-1) controlling drop-shadow strength across the UI. */
  shadowIntensity: number;
  /** Opacity (0-1) of the accent-tinted rim light along the top edge of every glass surface — the app's signature surface detail. */
  edgeLight: number;
}

export const TOKEN_CSS_VARS: Record<keyof ThemeTokens, string> = {
  accent: '--ws-color-accent',
  accentContrast: '--ws-color-accent-contrast',
  background: '--ws-color-background',
  surface: '--ws-color-surface',
  surfaceBorder: '--ws-color-surface-border',
  textPrimary: '--ws-color-text-primary',
  textSecondary: '--ws-color-text-secondary',
  textTertiary: '--ws-color-text-tertiary',
  onWallpaper: '--ws-color-text-on-wallpaper',
  onWallpaperSecondary: '--ws-color-text-on-wallpaper-secondary',
  success: '--ws-color-success',
  warning: '--ws-color-warning',
  danger: '--ws-color-danger',
  radius: '--ws-radius-base',
  glassBlur: '--ws-glass-blur',
  glassOpacity: '--ws-glass-opacity',
  shadowIntensity: '--ws-shadow-intensity',
  edgeLight: '--ws-edge-light-opacity'
};

export const DEFAULT_TOKENS: ThemeTokens = {
  accent: '#8b7cf6',
  accentContrast: '#0a0a0f',
  background: '#0b0b10',
  surface: '#ffffff',
  surfaceBorder: '#ffffff',
  textPrimary: '#f5f5f7',
  textSecondary: 'rgba(245, 245, 247, 0.72)',
  textTertiary: 'rgba(245, 245, 247, 0.48)',
  onWallpaper: '#f5f5f7',
  onWallpaperSecondary: 'rgba(245, 245, 247, 0.78)',
  success: '#4ade80',
  warning: '#fbbf24',
  danger: '#f87171',
  radius: 20,
  glassBlur: 28,
  glassOpacity: 0.1,
  shadowIntensity: 0.35,
  edgeLight: 0.35
};

export function tokenToCssValue(key: keyof ThemeTokens, value: ThemeTokens[keyof ThemeTokens]): string {
  switch (key) {
    case 'radius':
      return `${value}px`;
    case 'glassBlur':
      return `${value}px`;
    case 'glassOpacity':
    case 'shadowIntensity':
    case 'edgeLight':
      return `${value}`;
    default:
      return String(value);
  }
}
