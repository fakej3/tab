import { h } from '@core/dom/h';

export interface CalendarView {
  root: HTMLElement;
  render(monthDate: Date, startOnMonday: boolean): void;
}

export function createCalendarView(): CalendarView {
  const heading = h('div', { class: 'ws-calendar__heading' });
  const grid = h('div', { class: 'ws-calendar__grid' });
  const root = h('div', { class: 'ws-calendar' }, [heading, grid]);

  function render(monthDate: Date, startOnMonday: boolean): void {
    heading.textContent = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(monthDate);

    grid.replaceChildren();
    const weekdayLabels = getWeekdayLabels(startOnMonday);
    for (const label of weekdayLabels) grid.append(h('div', { class: 'ws-calendar__weekday' }, [label]));

    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const firstWeekday = (firstOfMonth.getDay() + (startOnMonday ? 6 : 0)) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    for (let i = 0; i < firstWeekday; i += 1) grid.append(h('div', { class: 'ws-calendar__day is-empty' }));

    for (let day = 1; day <= daysInMonth; day += 1) {
      const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
      grid.append(h('div', { class: `ws-calendar__day${isToday ? ' is-today' : ''}` }, [String(day)]));
    }
  }

  return { root, render };
}

function getWeekdayLabels(startOnMonday: boolean): string[] {
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return startOnMonday ? [...labels.slice(1), labels[0]!] : labels;
}
