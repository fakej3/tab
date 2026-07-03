import { h } from '@core/dom/h';
import type { SettingField } from '@core/settings/SettingsSchema';

export interface FieldRenderContext {
  getValue: (key: string) => unknown;
  setValue: (key: string, value: unknown) => void;
  allValues: () => Record<string, unknown>;
}

/**
 * Renders one settings field generically from its schema. This is what
 * makes "everything customizable" tractable: a plugin author declares a
 * field once (settings.ts) and it appears in the panel with zero UI code.
 */
export function renderField(field: SettingField, ctx: FieldRenderContext): HTMLElement {
  const row = h('div', { class: 'ws-field', 'data-key': field.key });

  const update = () => {
    const visible = field.visibleWhen ? field.visibleWhen(ctx.allValues()) : true;
    row.hidden = !visible;
  };
  update();

  const labelRow = h('div', { class: 'ws-field__label-row' }, [h('label', { class: 'ws-field__label', for: `field-${field.key}` }, [field.label])]);

  const control = buildControl(field, ctx, update);
  if (field.type === 'range' && 'unit' in field) {
    const valueLabel = h('span', { class: 'ws-field__value' }, [formatRangeValue(ctx.getValue(field.key) as number, field)]);
    labelRow.append(valueLabel);
    control.addEventListener('input', () => {
      valueLabel.textContent = formatRangeValue(ctx.getValue(field.key) as number, field);
    });
  }

  row.append(labelRow, control);
  if (field.description) row.append(h('p', { class: 'ws-field__description' }, [field.description]));

  return row;
}

function formatRangeValue(value: number, field: Extract<SettingField, { type: 'range' }>): string {
  const rounded = Number.isInteger(field.step ?? 1) ? Math.round(value) : Math.round(value * 100) / 100;
  return `${rounded}${field.unit ?? ''}`;
}

function buildControl(field: SettingField, ctx: FieldRenderContext, onChange: () => void): HTMLElement {
  const id = `field-${field.key}`;

  switch (field.type) {
    case 'boolean': {
      const checked = Boolean(ctx.getValue(field.key));
      const input = h('input', {
        id,
        type: 'checkbox',
        class: 'ws-switch__input',
        onchange: (e: Event) => {
          ctx.setValue(field.key, (e.target as HTMLInputElement).checked);
          onChange();
        }
      }) as HTMLInputElement;
      input.checked = checked;
      return h('label', { class: 'ws-switch' }, [input, h('span', { class: 'ws-switch__track' })]);
    }

    case 'range': {
      const input = h('input', {
        id,
        type: 'range',
        class: 'ws-range',
        min: String(field.min),
        max: String(field.max),
        step: String(field.step ?? 1),
        oninput: (e: Event) => {
          ctx.setValue(field.key, Number((e.target as HTMLInputElement).value));
          onChange();
        }
      }) as HTMLInputElement;
      input.value = String(ctx.getValue(field.key));
      return input;
    }

    case 'select': {
      const select = h(
        'select',
        {
          id,
          class: 'ws-select',
          onchange: (e: Event) => {
            ctx.setValue(field.key, (e.target as HTMLSelectElement).value);
            onChange();
          }
        },
        field.options.map((option) => h('option', { value: option.value }, [option.label]))
      ) as HTMLSelectElement;
      select.value = String(ctx.getValue(field.key));
      return select;
    }

    case 'color': {
      const input = h('input', {
        id,
        type: 'color',
        class: 'ws-color',
        oninput: (e: Event) => {
          ctx.setValue(field.key, (e.target as HTMLInputElement).value);
          onChange();
        }
      }) as HTMLInputElement;
      input.value = String(ctx.getValue(field.key) || '#000000');
      return input;
    }

    case 'number': {
      const input = h('input', {
        id,
        type: 'number',
        class: 'ws-text-input',
        min: field.min !== undefined ? String(field.min) : undefined,
        max: field.max !== undefined ? String(field.max) : undefined,
        oninput: (e: Event) => {
          ctx.setValue(field.key, Number((e.target as HTMLInputElement).value));
          onChange();
        }
      }) as HTMLInputElement;
      input.value = String(ctx.getValue(field.key));
      return input;
    }

    case 'font':
    case 'string':
    default: {
      const input = h('input', {
        id,
        type: 'text',
        class: 'ws-text-input',
        placeholder: 'placeholder' in field ? field.placeholder : undefined,
        oninput: (e: Event) => {
          ctx.setValue(field.key, (e.target as HTMLInputElement).value);
          onChange();
        }
      }) as HTMLInputElement;
      input.value = String(ctx.getValue(field.key) ?? '');
      return input;
    }
  }
}
