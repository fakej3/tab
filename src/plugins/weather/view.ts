import { h } from '@core/dom/h';
import { icons } from '@core/dom/icons';

export function createWeatherPlaceholder(): HTMLElement {
  return h('div', { class: 'ws-empty-state' }, [
    h('div', { class: 'ws-empty-state__icon' }, [icons.cloud()]),
    h('p', { class: 'ws-empty-state__title' }, ['Weather isn’t connected to a live provider yet.']),
    h('p', { class: 'ws-empty-state__hint' }, ['See plugins/weather/README.md to wire one up.'])
  ]);
}
