import type { EventBus } from '@core/event-bus/EventBus';
import type { WorkspaceEvents } from '@core/event-bus/events';
import type { SettingsManager } from '@core/settings/SettingsManager';
import type { SettingsSection } from '@core/settings/SettingsSchema';
import type { ThemeEngine } from '@core/theme/ThemeEngine';
import { DEFAULT_TYPOGRAPHY_TOKENS, TOKEN_CSS_VARS, typographyValueToCss, type TypographyTokens } from './tokens';
import { TYPOGRAPHY_PRESETS, getTypographyPreset } from './presets';

const NAMESPACE = 'typography';

const TYPOGRAPHY_SECTION: SettingsSection = {
  namespace: NAMESPACE,
  title: 'Typography',
  description: 'One of the most important dials in the workspace — the clock, quotes, and every label read through this.',
  order: 20,
  fields: [
    {
      key: 'preset',
      type: 'select',
      label: 'Preset',
      default: 'minimal',
      options: TYPOGRAPHY_PRESETS.map((preset) => ({ label: preset.name, value: preset.id }))
    },
    {
      key: 'fontSizeBase',
      type: 'range',
      label: 'Base size',
      default: DEFAULT_TYPOGRAPHY_TOKENS.fontSizeBase,
      min: 13,
      max: 18,
      step: 1,
      unit: 'px'
    },
    {
      key: 'lineHeightBase',
      type: 'range',
      label: 'Line height',
      default: DEFAULT_TYPOGRAPHY_TOKENS.lineHeightBase,
      min: 1.2,
      max: 1.8,
      step: 0.05
    },
    {
      key: 'letterSpacingDisplay',
      type: 'range',
      label: 'Display tracking',
      description: 'Letter-spacing of the clock and other large display text.',
      default: DEFAULT_TYPOGRAPHY_TOKENS.letterSpacingDisplay,
      min: -0.06,
      max: 0.08,
      step: 0.005
    },
    {
      key: 'uppercaseLabels',
      type: 'boolean',
      label: 'Uppercase labels',
      default: false
    }
  ]
};

const PRESET_SEEDED_KEYS: (keyof TypographyTokens)[] = [
  'fontFamily',
  'fontFamilyDisplay',
  'fontWeightDisplay',
  'letterSpacingDisplay',
  'lineHeightBase',
  'textTransformLabel'
];

/**
 * Typography is treated as a first-class token system, exactly like color:
 * one settings section, a handful of presets, everything resolved through
 * CSS custom properties so no plugin ever hardcodes a font-family or
 * font-weight. Mirrors ThemeEngine's preset/manual-override split (and its
 * preset re-seeding fix) rather than inventing a second pattern.
 */
export class TypographyEngine {
  private current: TypographyTokens = DEFAULT_TYPOGRAPHY_TOKENS;
  private lastPresetId: string | null = null;

  constructor(
    private settings: SettingsManager,
    private theme: ThemeEngine,
    private bus: EventBus<WorkspaceEvents>
  ) {}

  init(): void {
    this.settings.registerSection(TYPOGRAPHY_SECTION);
    this.applyFromSettings();
    this.settings.subscribeNamespace(NAMESPACE, () => this.applyFromSettings());
  }

  getTokens(): TypographyTokens {
    return this.current;
  }

  private applyFromSettings(): void {
    const values = this.settings.getNamespace(NAMESPACE);
    const presetId = (values.preset as string) ?? TYPOGRAPHY_SECTION.fields[0]!.default;
    const preset = getTypographyPreset(presetId);

    if (this.lastPresetId !== null && presetId !== this.lastPresetId) {
      this.lastPresetId = presetId;
      for (const key of PRESET_SEEDED_KEYS) this.settings.set(NAMESPACE, key, preset.tokens[key]);
      return;
    }
    this.lastPresetId = presetId;

    const uppercaseLabels = Boolean(values.uppercaseLabels);
    const tokens: TypographyTokens = {
      ...preset.tokens,
      fontSizeBase: (values.fontSizeBase as number) ?? preset.tokens.fontSizeBase,
      lineHeightBase: (values.lineHeightBase as number) ?? preset.tokens.lineHeightBase,
      letterSpacingDisplay: (values.letterSpacingDisplay as number) ?? preset.tokens.letterSpacingDisplay,
      textTransformLabel: uppercaseLabels ? 'uppercase' : preset.tokens.textTransformLabel
    };

    this.current = tokens;
    const variables: Record<string, string> = {};
    for (const key of Object.keys(tokens) as (keyof TypographyTokens)[]) {
      variables[TOKEN_CSS_VARS[key]] = typographyValueToCss(key, tokens[key]);
    }
    this.theme.applyVariables(variables);
    this.bus.emit('theme:tokens-updated', undefined);
  }
}
