import type { AnimationTokens } from './tokens';

export type MotionPreset = 'fade' | 'scale' | 'slide-up' | 'slide-down' | 'blur' | 'ripple' | 'spring';

export interface MotionOptions {
  duration?: 'fast' | 'base' | 'slow';
  easing?: 'standard' | 'emphasized' | 'spring';
  fill?: FillMode;
  direction?: 'in' | 'out';
}

const KEYFRAMES: Record<MotionPreset, { in: Keyframe[]; out: Keyframe[] }> = {
  fade: {
    in: [{ opacity: 0 }, { opacity: 1 }],
    out: [{ opacity: 1 }, { opacity: 0 }]
  },
  scale: {
    in: [{ opacity: 0, transform: 'scale(0.94)' }, { opacity: 1, transform: 'scale(1)' }],
    out: [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.94)' }]
  },
  'slide-up': {
    in: [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }],
    out: [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(12px)' }]
  },
  'slide-down': {
    in: [{ opacity: 0, transform: 'translateY(-12px)' }, { opacity: 1, transform: 'translateY(0)' }],
    out: [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-12px)' }]
  },
  blur: {
    in: [{ opacity: 0, filter: 'blur(8px)' }, { opacity: 1, filter: 'blur(0)' }],
    out: [{ opacity: 1, filter: 'blur(0)' }, { opacity: 0, filter: 'blur(8px)' }]
  },
  ripple: {
    in: [{ opacity: 0.6, transform: 'scale(0)' }, { opacity: 0, transform: 'scale(2.6)' }],
    out: [{ opacity: 0, transform: 'scale(2.6)' }, { opacity: 0.6, transform: 'scale(0)' }]
  },
  spring: {
    in: [
      { opacity: 0, transform: 'scale(0.85)' },
      { opacity: 1, transform: 'scale(1.03)', offset: 0.7 },
      { opacity: 1, transform: 'scale(1)' }
    ],
    out: [
      { opacity: 1, transform: 'scale(1)' },
      { opacity: 0, transform: 'scale(0.85)' }
    ]
  }
};

/**
 * Runs a named motion preset via the Web Animations API. This is the only
 * sanctioned way to animate in the app — no ad-hoc CSS `@keyframes` scattered
 * across plugin stylesheets. Honors `reduceMotion` by collapsing to an
 * instant, opacity-only transition.
 */
export function runMotion(
  element: Element,
  preset: MotionPreset,
  tokens: AnimationTokens,
  options: MotionOptions = {}
): Animation {
  const direction = options.direction ?? 'in';
  const durationKey = options.duration ?? 'base';
  const easingKey = options.easing ?? 'standard';

  const durationMs =
    (durationKey === 'fast'
      ? tokens.durationFast
      : durationKey === 'slow'
        ? tokens.durationSlow
        : tokens.durationBase) * tokens.speedMultiplier;

  const easing =
    easingKey === 'spring' ? tokens.easingSpring : easingKey === 'emphasized' ? tokens.easingEmphasized : tokens.easingStandard;

  if (tokens.reduceMotion) {
    const frames = direction === 'in' ? [{ opacity: 0 }, { opacity: 1 }] : [{ opacity: 1 }, { opacity: 0 }];
    return element.animate(frames, { duration: Math.min(durationMs, 90), fill: options.fill ?? 'forwards' });
  }

  const frames = KEYFRAMES[preset][direction];
  return element.animate(frames, {
    duration: durationMs,
    easing,
    fill: options.fill ?? 'forwards'
  });
}
