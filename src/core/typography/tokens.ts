export interface TypographyTokens {
  /** Body text stack — settings, menus, secondary labels. */
  fontFamily: string;
  /** Display stack — the clock, large numerals, headline moments. */
  fontFamilyDisplay: string;
  fontFamilyMono: string;
  fontSizeBase: number;
  letterSpacingBase: number;
  lineHeightBase: number;
  fontWeightDisplay: number;
  letterSpacingDisplay: number;
  textTransformLabel: 'none' | 'uppercase';
}

const SYSTEM_SANS = `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif`;
const GEOMETRIC_SANS = `'Avenir Next', 'Century Gothic', 'Segoe UI', -apple-system, sans-serif`;
const GROTESK = `'Helvetica Neue', Helvetica, Arial, sans-serif`;
const SERIF = `Georgia, 'Iowan Old Style', 'Times New Roman', serif`;
const DISPLAY_SERIF = `'Didot', 'Bodoni MT', Georgia, serif`;
const MONO = `'SF Mono', 'JetBrains Mono', ui-monospace, Menlo, monospace`;

export const TOKEN_CSS_VARS: Record<keyof TypographyTokens, string> = {
  fontFamily: '--ws-font-family',
  fontFamilyDisplay: '--ws-font-family-display',
  fontFamilyMono: '--ws-font-family-mono',
  fontSizeBase: '--ws-font-size-base',
  letterSpacingBase: '--ws-letter-spacing-base',
  lineHeightBase: '--ws-line-height-base',
  fontWeightDisplay: '--ws-font-weight-display',
  letterSpacingDisplay: '--ws-letter-spacing-display',
  textTransformLabel: '--ws-text-transform-label'
};

export const DEFAULT_TYPOGRAPHY_TOKENS: TypographyTokens = {
  fontFamily: `'Workspace Sans', ${SYSTEM_SANS}`,
  fontFamilyDisplay: `'Workspace Sans', ${SYSTEM_SANS}`,
  fontFamilyMono: `'Workspace Mono', ${MONO}`,
  fontSizeBase: 15,
  letterSpacingBase: 0,
  lineHeightBase: 1.5,
  fontWeightDisplay: 200,
  letterSpacingDisplay: -0.02,
  textTransformLabel: 'none'
};

export function typographyValueToCss(key: keyof TypographyTokens, value: TypographyTokens[keyof TypographyTokens]): string {
  switch (key) {
    case 'fontSizeBase':
      return `${value}px`;
    case 'letterSpacingBase':
    case 'letterSpacingDisplay':
      return `${value}em`;
    case 'lineHeightBase':
    case 'fontWeightDisplay':
      return `${value}`;
    default:
      return String(value);
  }
}

export { SYSTEM_SANS, GEOMETRIC_SANS, GROTESK, SERIF, DISPLAY_SERIF, MONO };
