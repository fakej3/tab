import { h } from '@core/dom/h';
import { icons } from '@core/dom/icons';

export function createAiPlaceholder(hasKey: boolean): HTMLElement {
  return h('div', { class: 'ws-empty-state' }, [
    h('div', { class: 'ws-empty-state__icon' }, [icons.sparkle()]),
    h('p', { class: 'ws-empty-state__title' }, [
      hasKey ? 'API key saved. Provider wiring not implemented yet.' : 'Add an API key in Settings to get started.'
    ]),
    h('p', { class: 'ws-empty-state__hint' }, ['See plugins/ai/README.md to connect a provider.'])
  ]);
}
