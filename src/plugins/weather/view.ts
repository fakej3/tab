import { h } from '@core/dom/h';
import { icons } from '@core/dom/icons';

export function createWeatherPlaceholder(): HTMLElement {
  return h('div', { class: 'ws-empty-state' }, [
    h('div', { class: 'ws-empty-state__icon' }, [icons.cloud()]),
    h('p', { class: 'ws-empty-state__title' }, ['No weather source yet']),
    h('p', { class: 'ws-empty-state__hint' }, ['Connect one from Settings → Weather.'])
  ]);
}
