export interface AnimationTokens {
  /** Global multiplier applied to every duration (0.5 = snappier, 2 = slower/dreamier). */
  speedMultiplier: number;
  durationFast: number;
  durationBase: number;
  durationSlow: number;
  easingStandard: string;
  easingEmphasized: string;
  easingSpring: string;
  reduceMotion: boolean;
  entranceAnimation: boolean;
}

export const DEFAULT_ANIMATION_TOKENS: AnimationTokens = {
  speedMultiplier: 1,
  durationFast: 120,
  durationBase: 220,
  durationSlow: 420,
  easingStandard: 'cubic-bezier(0.22, 1, 0.36, 1)',
  easingEmphasized: 'cubic-bezier(0.16, 1, 0.3, 1)',
  easingSpring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  reduceMotion: false,
  entranceAnimation: true
};

export const ANIMATION_CSS_VARS = {
  durationFast: '--ws-duration-fast',
  durationBase: '--ws-duration-base',
  durationSlow: '--ws-duration-slow',
  easingStandard: '--ws-ease-standard',
  easingEmphasized: '--ws-ease-emphasized',
  easingSpring: '--ws-ease-spring'
} as const;
