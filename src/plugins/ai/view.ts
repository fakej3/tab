import { h } from '@core/dom/h';

export function createAiPlaceholder(hasKey: boolean): HTMLElement {
  return h('div', { class: 'ws-ai' }, [
    h('div', { class: 'ws-ai__icon' }, ['✳︎']),
    h('p', { class: 'ws-ai__message' }, [hasKey ? 'API key saved. Provider wiring not implemented yet.' : 'Add an API key in Settings to get started.']),
    h('p', { class: 'ws-ai__hint' }, ['See plugins/ai/README.md to connect a provider.'])
  ]);
}
