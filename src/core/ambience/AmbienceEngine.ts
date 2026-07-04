import type { EventBus } from '@core/event-bus/EventBus';
import type { WorkspaceEvents } from '@core/event-bus/events';
import { h } from '@core/dom/h';
import type { SettingsManager } from '@core/settings/SettingsManager';
import type { SettingsSection } from '@core/settings/SettingsSchema';
import { clamp } from '@core/utils/clamp';
import { GRAIN_BACKGROUND_IMAGE } from './grain';
import './styles.css';

const NAMESPACE = 'ambience';

const AMBIENCE_SECTION: SettingsSection = {
  namespace: NAMESPACE,
  title: 'Ambience',
  description: 'Optional atmosphere. Every effect here can be switched off individually — none of them are required for the workspace to feel complete.',
  order: 5,
  fields: [
    {
      key: 'cursorGlow',
      type: 'boolean',
      label: 'Cursor glow',
      description: 'A soft accent-colored light that drifts toward the cursor.',
      default: true
    },
    {
      key: 'cursorGlowIntensity',
      type: 'range',
      label: 'Glow intensity',
      default: 0.5,
      min: 0.1,
      max: 1,
      step: 0.05,
      visibleWhen: (values) => values.cursorGlow === true
    },
    {
      key: 'grain',
      type: 'boolean',
      label: 'Film grain',
      description: 'A faint animated texture that unifies the whole composition.',
      default: true
    },
    {
      key: 'grainIntensity',
      type: 'range',
      label: 'Grain intensity',
      default: 0.35,
      min: 0.05,
      max: 1,
      step: 0.05,
      visibleWhen: (values) => values.grain === true
    }
  ]
};

/**
 * Owns the two ambient, non-interactive visual layers that make up the
 * app's signature atmosphere: a cursor-following accent glow (sits between
 * the wallpaper and the widgets, like ambient light in the room) and a
 * film-grain texture (sits above everything, like a screen overlay,
 * unifying the whole composition). Neither ever intercepts pointer events
 * and both are fully optional — see the Ambience settings section.
 */
export class AmbienceEngine {
  private glowLayer: HTMLElement | null = null;
  private grainLayer: HTMLElement | null = null;
  private pointerAttached = false;
  private rafHandle = 0;

  constructor(
    private settings: SettingsManager,
    private bus: EventBus<WorkspaceEvents>
  ) {}

  init(): void {
    this.settings.registerSection(AMBIENCE_SECTION);
    this.settings.subscribeNamespace(NAMESPACE, () => this.applyFromSettings());
    // Reduce-motion can also come from the app's own "Reduce motion" toggle
    // (Motion settings), not just the OS preference — re-evaluate whenever
    // that changes too, since AnimationEngine is what keeps the shared
    // `is-reduced-motion` class (checked below) in sync with both sources.
    this.settings.subscribeNamespace('animation', () => this.applyFromSettings());
  }

  private prefersReducedMotion(): boolean {
    return document.documentElement.classList.contains('is-reduced-motion');
  }

  mount(container: HTMLElement): void {
    this.glowLayer = h('div', { class: 'ws-ambient-glow', 'aria-hidden': 'true' });
    this.grainLayer = h('div', {
      class: 'ws-ambient-grain',
      'aria-hidden': 'true',
      style: `background-image:${GRAIN_BACKGROUND_IMAGE}`
    });
    container.append(this.glowLayer, this.grainLayer);
    this.applyFromSettings();
  }

  private applyFromSettings(): void {
    if (!this.glowLayer || !this.grainLayer) return;
    const values = this.settings.getNamespace(NAMESPACE) as {
      cursorGlow: boolean;
      cursorGlowIntensity: number;
      grain: boolean;
      grainIntensity: number;
    };

    const glowEnabled = values.cursorGlow && !this.prefersReducedMotion();
    this.glowLayer.classList.toggle('is-active', glowEnabled);
    this.glowLayer.style.setProperty('--ws-glow-opacity', String(values.cursorGlowIntensity * 0.6));
    if (glowEnabled) this.attachPointerTracking();

    this.grainLayer.classList.toggle('is-active', values.grain);
    this.grainLayer.classList.toggle('is-animated', values.grain && !this.prefersReducedMotion());
    this.grainLayer.style.setProperty('--ws-grain-opacity', String(values.grainIntensity * 0.09));
  }

  private attachPointerTracking(): void {
    if (this.pointerAttached) return;
    this.pointerAttached = true;
    window.addEventListener('pointermove', (event) => {
      if (this.rafHandle) return;
      this.rafHandle = requestAnimationFrame(() => {
        this.rafHandle = 0;
        if (!this.glowLayer || !this.glowLayer.classList.contains('is-active')) return;
        const x = clamp(event.clientX, 0, window.innerWidth);
        const y = clamp(event.clientY, 0, window.innerHeight);
        this.glowLayer.style.setProperty('--ws-glow-x', `${x}px`);
        this.glowLayer.style.setProperty('--ws-glow-y', `${y}px`);
      });
    });
  }
}
