import {
  DEFAULT_TYPOGRAPHY_TOKENS,
  DISPLAY_SERIF,
  GEOMETRIC_SANS,
  GROTESK,
  MONO,
  SERIF,
  SYSTEM_SANS,
  type TypographyTokens
} from './tokens';

export interface TypographyPreset {
  id: string;
  name: string;
  description: string;
  tokens: TypographyTokens;
}

export const TYPOGRAPHY_PRESETS: TypographyPreset[] = [
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Thin, quiet, system-native.',
    tokens: DEFAULT_TYPOGRAPHY_TOKENS
  },
  {
    id: 'editorial',
    name: 'Editorial',
    description: 'A serif display face with warm, readable body text.',
    tokens: {
      ...DEFAULT_TYPOGRAPHY_TOKENS,
      fontFamilyDisplay: SERIF,
      fontWeightDisplay: 400,
      letterSpacingDisplay: 0,
      lineHeightBase: 1.6
    }
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Geometric sans, confident and light.',
    tokens: {
      ...DEFAULT_TYPOGRAPHY_TOKENS,
      fontFamily: GEOMETRIC_SANS,
      fontFamilyDisplay: GEOMETRIC_SANS,
      fontWeightDisplay: 300,
      letterSpacingDisplay: -0.01
    }
  },
  {
    id: 'elegant',
    name: 'Elegant',
    description: 'A refined display serif with generous tracking.',
    tokens: {
      ...DEFAULT_TYPOGRAPHY_TOKENS,
      fontFamilyDisplay: DISPLAY_SERIF,
      fontWeightDisplay: 300,
      letterSpacingDisplay: 0.02,
      lineHeightBase: 1.55
    }
  },
  {
    id: 'swiss',
    name: 'Swiss',
    description: 'Tight grotesk headlines, tracked uppercase labels.',
    tokens: {
      ...DEFAULT_TYPOGRAPHY_TOKENS,
      fontFamily: GROTESK,
      fontFamilyDisplay: GROTESK,
      fontWeightDisplay: 500,
      letterSpacingDisplay: -0.03,
      textTransformLabel: 'uppercase'
    }
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Serif throughout, unhurried and literary.',
    tokens: {
      ...DEFAULT_TYPOGRAPHY_TOKENS,
      fontFamily: SERIF,
      fontFamilyDisplay: SERIF,
      fontWeightDisplay: 400,
      letterSpacingDisplay: 0,
      lineHeightBase: 1.65
    }
  },
  {
    id: 'monospace',
    name: 'Monospace',
    description: 'Everything in mono — technical and deliberate.',
    tokens: {
      ...DEFAULT_TYPOGRAPHY_TOKENS,
      fontFamily: MONO,
      fontFamilyDisplay: MONO,
      fontWeightDisplay: 500,
      letterSpacingDisplay: -0.02
    }
  }
];

export function getTypographyPreset(id: string): TypographyPreset {
  return TYPOGRAPHY_PRESETS.find((preset) => preset.id === id) ?? TYPOGRAPHY_PRESETS[0]!;
}

export { SYSTEM_SANS };
