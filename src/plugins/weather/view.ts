import { h } from '@core/dom/h';

export function createWeatherPlaceholder(): HTMLElement {
  return h('div', { class: 'ws-weather' }, [
    h('div', { class: 'ws-weather__icon' }, ['☁︎']),
    h('p', { class: 'ws-weather__message' }, ['Weather isn’t connected to a live provider yet.']),
    h('p', { class: 'ws-weather__hint' }, ['See plugins/weather/README.md to wire one up.'])
  ]);
}
