/**
 * Declarative description of a customizable value. Every knob in the app —
 * core engine or plugin — is registered as a `SettingField` rather than
 * wired up as bespoke UI. The Settings Panel renders these generically,
 * which is what lets "everything" become customizable without the panel
 * growing bespoke code per feature.
 */
export type SettingFieldType =
  | 'boolean'
  | 'string'
  | 'number'
  | 'range'
  | 'select'
  | 'color'
  | 'font'
  | 'image'
  | 'group';

export interface SettingOption {
  label: string;
  value: string;
}

export interface SettingFieldBase<T> {
  key: string;
  type: SettingFieldType;
  label: string;
  description?: string;
  default: T;
  /** Show/hide this field based on sibling values, e.g. hide "blur" when "enabled" is false. */
  visibleWhen?: (values: Record<string, unknown>) => boolean;
  /** Excludes this field from the generic Settings Panel renderer — for values that need bespoke UI (e.g. an image gallery). */
  hiddenInPanel?: boolean;
}

export interface RangeField extends SettingFieldBase<number> {
  type: 'range';
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

export interface SelectField extends SettingFieldBase<string> {
  type: 'select';
  options: SettingOption[];
}

export interface BooleanField extends SettingFieldBase<boolean> {
  type: 'boolean';
}

export interface StringField extends SettingFieldBase<string> {
  type: 'string';
  placeholder?: string;
}

export interface NumberField extends SettingFieldBase<number> {
  type: 'number';
  min?: number;
  max?: number;
}

export interface ColorField extends SettingFieldBase<string> {
  type: 'color';
}

export interface FontField extends SettingFieldBase<string> {
  type: 'font';
}

export interface ImageField extends SettingFieldBase<string> {
  type: 'image';
}

export type SettingField =
  | RangeField
  | SelectField
  | BooleanField
  | StringField
  | NumberField
  | ColorField
  | FontField
  | ImageField;

export interface SettingsSection {
  /** Namespace all field keys are stored under, e.g. "theme", "plugin.clock". */
  namespace: string;
  title: string;
  description?: string;
  icon?: string;
  order?: number;
  fields: SettingField[];
}

export function defaultsFromSection(section: SettingsSection): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  for (const field of section.fields) defaults[field.key] = field.default;
  return defaults;
}
