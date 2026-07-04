import { h } from '@core/dom/h';
import { icons } from '@core/dom/icons';

export function createAiPlaceholder(hasKey: boolean): HTMLElement {
  return h('div', { class: 'ws-empty-state' }, [
    h('div', { class: 'ws-empty-state__icon' }, [icons.sparkle()]),
    h('p', { class: 'ws-empty-state__title' }, [hasKey ? 'Key saved — provider coming soon' : 'No assistant connected yet']),
    h('p', { class: 'ws-empty-state__hint' }, ['Add a key from Settings → AI.'])
  ]);
}
