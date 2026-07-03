import type { EventBus } from '@core/event-bus/EventBus';
import type { WorkspaceEvents } from '@core/event-bus/events';
import type { SettingsManager } from '@core/settings/SettingsManager';
import type { SettingsSection } from '@core/settings/SettingsSchema';
import { DEFAULT_TOKENS, TOKEN_CSS_VARS, tokenToCssValue, type ThemeTokens } from './tokens';
import { THEME_PRESETS, getPreset } from './presets';

const NAMESPACE = 'theme';

const THEME_SECTION: SettingsSection = {
  namespace: NAMESPACE,
  title: 'Theme',
  description: 'Colors, glass, and surface style — applied everywhere instantly.',
  order: 10,
  fields: [
    {
      key: 'preset',
      type: 'select',
      label: 'Preset',
      default: 'midnight-glass',
      options: THEME_PRESETS.map((preset) => ({ label: preset.name, value: preset.id }))
    },
    { key: 'accent', type: 'color', label: 'Accent color', default: DEFAULT_TOKENS.accent },
    { key: 'background', type: 'color', label: 'Base background', default: DEFAULT_TOKENS.background },
    { key: 'textPrimary', type: 'color', label: 'Primary text', default: DEFAULT_TOKENS.textPrimary },
    {
      key: 'radius',
      type: 'range',
      label: 'Corner radius',
      default: DEFAULT_TOKENS.radius,
      min: 0,
      max: 40,
      step: 1,
      unit: 'px'
    },
    {
      key: 'glassBlur',
      type: 'range',
      label: 'Glass blur',
      default: DEFAULT_TOKENS.glassBlur,
      min: 0,
      max: 60,
      step: 1,
      unit: 'px'
    },
    {
      key: 'glassOpacity',
      type: 'range',
      label: 'Glass opacity',
      default: DEFAULT_TOKENS.glassOpacity,
      min: 0,
      max: 1,
      step: 0.01
    },
    {
      key: 'shadowIntensity',
      type: 'range',
      label: 'Shadow intensity',
      default: DEFAULT_TOKENS.shadowIntensity,
      min: 0,
      max: 1,
      step: 0.01
    }
  ]
};

/**
 * The only module that writes color/surface CSS custom properties onto the
 * document root. Other engines (typography, animation) get the same
 * `applyVariables` mechanism so there is exactly one code path that touches
 * global inline styles — easy to reason about, easy to serialize/export.
 */
/** Settings fields that shadow a token value; switching presets re-seeds these so the preset actually takes visual effect. */
const PRESET_SEEDED_KEYS: (keyof ThemeTokens)[] = [
  'accent',
  'background',
  'textPrimary',
  'radius',
  'glassBlur',
  'glassOpacity',
  'shadowIntensity'
];

export class ThemeEngine {
  private root = document.documentElement;
  private current: ThemeTokens = DEFAULT_TOKENS;
  private lastPresetId: string | null = null;

  constructor(
    private settings: SettingsManager,
    private bus: EventBus<WorkspaceEvents>
  ) {}

  init(): void {
    this.settings.registerSection(THEME_SECTION);
    this.applyFromSettings();
    this.settings.subscribeNamespace(NAMESPACE, () => this.applyFromSettings());
  }

  private applyFromSettings(): void {
    const values = this.settings.getNamespace(NAMESPACE);
    const presetId = (values.preset as string) ?? THEME_SECTION.fields[0]!.default;
    const preset = getPreset(presetId);

    // A preset is a starting point, not just a fallback: the individual
    // color/surface fields below are real, independently-stored settings
    // (so users can fine-tune them), which means they'd otherwise keep
    // whatever value they had under the *previous* preset forever. When the
    // preset itself changes, re-seed those fields from the new preset. Each
    // `set` re-enters this method, but `lastPresetId` is updated first so
    // the recursive calls fall straight through to rendering below.
    if (this.lastPresetId !== null && presetId !== this.lastPresetId) {
      this.lastPresetId = presetId;
      for (const key of PRESET_SEEDED_KEYS) this.settings.set(NAMESPACE, key, preset.tokens[key]);
      return;
    }
    this.lastPresetId = presetId;

    const tokens: ThemeTokens = {
      ...preset.tokens,
      accent: (values.accent as string) ?? preset.tokens.accent,
      background: (values.background as string) ?? preset.tokens.background,
      textPrimary: (values.textPrimary as string) ?? preset.tokens.textPrimary,
      radius: (values.radius as number) ?? preset.tokens.radius,
      glassBlur: (values.glassBlur as number) ?? preset.tokens.glassBlur,
      glassOpacity: (values.glassOpacity as number) ?? preset.tokens.glassOpacity,
      shadowIntensity: (values.shadowIntensity as number) ?? preset.tokens.shadowIntensity
    };

    this.applyTokens(tokens);
    this.bus.emit('theme:changed', { themeId: presetId });
  }

  private applyTokens(tokens: ThemeTokens): void {
    this.current = tokens;
    const variables: Record<string, string> = {};
    for (const key of Object.keys(tokens) as (keyof ThemeTokens)[]) {
      variables[TOKEN_CSS_VARS[key]] = tokenToCssValue(key, tokens[key]);
    }
    this.applyVariables(variables);
    this.bus.emit('theme:tokens-updated', undefined);
  }

  /** Generic CSS custom property writer used by ThemeEngine itself and other engines (typography, animation). */
  applyVariables(variables: Record<string, string>): void {
    for (const [name, value] of Object.entries(variables)) {
      this.root.style.setProperty(name, value);
    }
  }

  getTokens(): ThemeTokens {
    return this.current;
  }

  /** Apply a full palette (e.g. extracted from a wallpaper) as one-off overrides without changing the saved preset. */
  applyPaletteOverride(partial: Partial<Pick<ThemeTokens, 'accent' | 'background'>>): void {
    this.applyTokens({ ...this.current, ...partial });
  }
}
