import { h } from '@core/dom/h';
import type { ClockStyle } from './constants';

export interface ClockState {
  use24Hour: boolean;
  showSeconds: boolean;
  showDate: boolean;
  style: ClockStyle;
  sizeScale: number;
  uppercaseDate: boolean;
}

export interface ClockView {
  root: HTMLElement;
  update(now: Date, state: ClockState): void;
}

export function createClockView(): ClockView {
  const timeEl = h('div', { class: 'ws-clock__time' });
  const dateEl = h('div', { class: 'ws-clock__date' });
  const root = h('div', { class: 'ws-clock', role: 'group', 'aria-label': 'Clock' }, [timeEl, dateEl]);

  function update(now: Date, state: ClockState): void {
    root.dataset.style = state.style;
    root.style.setProperty('--ws-clock-scale', String(state.sizeScale));

    timeEl.textContent = formatTime(now, state);
    dateEl.hidden = !state.showDate;
    dateEl.textContent = state.showDate ? formatDate(now, state) : '';
  }

  return { root, update };
}

function formatTime(date: Date, state: ClockState): string {
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: !state.use24Hour
  };
  if (state.showSeconds) options.second = '2-digit';
  return new Intl.DateTimeFormat(undefined, options).format(date);
}

function formatDate(date: Date, state: ClockState): string {
  const formatted = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(date);
  return state.uppercaseDate ? formatted.toUpperCase() : formatted;
}
