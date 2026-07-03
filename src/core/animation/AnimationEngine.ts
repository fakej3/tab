import type { EventBus } from '@core/event-bus/EventBus';
import type { WorkspaceEvents } from '@core/event-bus/events';
import type { SettingsManager } from '@core/settings/SettingsManager';
import type { SettingsSection } from '@core/settings/SettingsSchema';
import type { ThemeEngine } from '@core/theme/ThemeEngine';
import { ANIMATION_CSS_VARS, DEFAULT_ANIMATION_TOKENS, type AnimationTokens } from './tokens';
import { runMotion, type MotionOptions, type MotionPreset } from './motion';

const NAMESPACE = 'animation';

const ANIMATION_SECTION: SettingsSection = {
  namespace: NAMESPACE,
  title: 'Motion',
  description: 'How the whole interface moves.',
  order: 40,
  fields: [
    {
      key: 'speedMultiplier',
      type: 'range',
      label: 'Animation speed',
      default: DEFAULT_ANIMATION_TOKENS.speedMultiplier,
      min: 0.5,
      max: 2,
      step: 0.1
    },
    {
      key: 'reduceMotion',
      type: 'boolean',
      label: 'Reduce motion',
      description: 'Collapses transitions to instant, subtle fades.',
      default: DEFAULT_ANIMATION_TOKENS.reduceMotion
    }
  ]
};

/**
 * Centralized motion service. Owns duration/easing tokens (exposed as CSS
 * vars for use in stylesheets) and `animate()` for JS-driven transitions, so
 * every plugin gets consistent, globally-tunable motion instead of
 * hand-rolled CSS animations.
 */
export class AnimationEngine {
  private tokens: AnimationTokens = DEFAULT_ANIMATION_TOKENS;
  private systemPrefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  constructor(
    private settings: SettingsManager,
    private theme: ThemeEngine,
    private bus: EventBus<WorkspaceEvents>
  ) {}

  init(): void {
    this.settings.registerSection(ANIMATION_SECTION);
    this.applyFromSettings();
    this.settings.subscribeNamespace(NAMESPACE, () => this.applyFromSettings());
    this.systemPrefersReducedMotion.addEventListener('change', () => this.applyFromSettings());
  }

  private applyFromSettings(): void {
    const values = this.settings.getNamespace(NAMESPACE);
    this.tokens = {
      ...DEFAULT_ANIMATION_TOKENS,
      speedMultiplier: (values.speedMultiplier as number) ?? DEFAULT_ANIMATION_TOKENS.speedMultiplier,
      reduceMotion: Boolean(values.reduceMotion) || this.systemPrefersReducedMotion.matches
    };

    this.theme.applyVariables({
      [ANIMATION_CSS_VARS.durationFast]: `${this.tokens.durationFast * this.tokens.speedMultiplier}ms`,
      [ANIMATION_CSS_VARS.durationBase]: `${this.tokens.durationBase * this.tokens.speedMultiplier}ms`,
      [ANIMATION_CSS_VARS.durationSlow]: `${this.tokens.durationSlow * this.tokens.speedMultiplier}ms`,
      [ANIMATION_CSS_VARS.easingStandard]: this.tokens.easingStandard,
      [ANIMATION_CSS_VARS.easingEmphasized]: this.tokens.easingEmphasized,
      [ANIMATION_CSS_VARS.easingSpring]: this.tokens.easingSpring
    });
  }

  getTokens(): AnimationTokens {
    return this.tokens;
  }

  animate(element: Element, preset: MotionPreset, options?: MotionOptions): Animation {
    return runMotion(element, preset, this.tokens, options);
  }
}
