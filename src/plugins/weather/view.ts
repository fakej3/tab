import { h } from '@core/dom/h';

export function createWeatherPlaceholder(): HTMLElement {
  return h('div', { class: 'ws-empty-state' }, [
    h('div', { class: 'ws-empty-state__icon' }, ['☁︎']),
    h('p', { class: 'ws-empty-state__title' }, ['Weather isn’t connected to a live provider yet.']),
    h('p', { class: 'ws-empty-state__hint' }, ['See plugins/weather/README.md to wire one up.'])
  ]);
}
