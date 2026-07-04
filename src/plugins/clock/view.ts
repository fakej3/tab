import { h } from '@core/dom/h';
import type { ClockStyle } from './constants';

export interface ClockState {
  use24Hour: boolean;
  showSeconds: boolean;
  showDate: boolean;
  style: ClockStyle;
  sizeScale: number;
  uppercaseDate: boolean;
  pulseSeconds: boolean;
}

export interface ClockView {
  root: HTMLElement;
  update(now: Date, state: ClockState): void;
}

export function createClockView(): ClockView {
  const timeEl = h('div', { class: 'ws-clock__time' });
  const dateEl = h('div', { class: 'ws-clock__date' });
  // Date leads, time is the headline beneath it — a masthead, not a
  // digital-clock readout. DOM order matches the visual order so it also
  // reads correctly to a screen reader.
  const root = h('div', { class: 'ws-clock', role: 'group', 'aria-label': 'Clock' }, [dateEl, timeEl]);

  function update(now: Date, state: ClockState): void {
    root.dataset.style = state.style;
    root.style.setProperty('--ws-clock-scale', String(state.sizeScale));

    timeEl.replaceChildren(...renderTimeParts(now, state));
    dateEl.hidden = !state.showDate;
    dateEl.textContent = state.showDate ? formatDate(now, state) : '';
  }

  return { root, update };
}

/**
 * Builds the time as separate nodes (via `formatToParts`, not a plain
 * string) specifically so the ":" separator can be its own element — a
 * fresh element every tick, so its pulse animation (see clock/styles.css)
 * replays once per second for free, no manual restart needed. This is the
 * clock's one signature detail: a quiet heartbeat instead of a static
 * readout.
 */
function renderTimeParts(date: Date, state: ClockState): (string | Node)[] {
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: !state.use24Hour
  };
  if (state.showSeconds) options.second = '2-digit';

  const parts = new Intl.DateTimeFormat(undefined, options).formatToParts(date);
  return parts.map((part) => {
    if (part.type === 'literal' && part.value === ':') {
      return h('span', { class: `ws-clock__colon${state.pulseSeconds ? ' is-pulsing' : ''}` }, [':']);
    }
    return part.value;
  });
}

function formatDate(date: Date, state: ClockState): string {
  const formatted = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(date);
  return state.uppercaseDate ? formatted.toUpperCase() : formatted;
}
