import { h, clearChildren } from '@core/dom/h';

export interface SearchViewCallbacks {
  onSubmit(query: string): void;
  onCopyResult(): void;
  onPickRecent(query: string): void;
}

export interface SearchView {
  root: HTMLElement;
  input: HTMLInputElement;
  setProviderHint(name: string | null): void;
  setInlineResult(text: string | null): void;
  flashCopied(): void;
  setPlaceholder(placeholder: string): void;
  setRecent(queries: string[]): void;
}

export function createSearchView(callbacks: SearchViewCallbacks): SearchView {
  let hasInlineResult = false;

  const hint = h('span', { class: 'ws-search__hint' });
  const result = h('span', { class: 'ws-search__result', 'aria-live': 'polite' });
  const input = h('input', {
    class: 'ws-search__input',
    type: 'text',
    autocomplete: 'off',
    spellcheck: false,
    'aria-label': 'Search the web'
  }) as HTMLInputElement;

  const recentList = h('div', { class: 'ws-search__recent', 'aria-label': 'Recent searches', hidden: true });

  function closeRecent(): void {
    recentList.hidden = true;
  }

  input.addEventListener('focus', () => {
    if (!input.value.trim() && recentList.childElementCount > 0) recentList.hidden = false;
  });
  input.addEventListener('blur', () => {
    // Defer so a click on a recent-search item registers before we hide the list.
    window.setTimeout(closeRecent, 120);
  });
  input.addEventListener('input', () => {
    if (input.value.trim()) closeRecent();
    else if (recentList.childElementCount > 0) recentList.hidden = false;
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && hasInlineResult) {
      event.preventDefault();
      callbacks.onCopyResult();
    } else if (event.key === 'Enter' && input.value.trim().length > 0) {
      callbacks.onSubmit(input.value.trim());
      input.value = '';
      closeRecent();
    } else if (event.key === 'Escape') {
      closeRecent();
      input.blur();
    }
  });

  const icon = h('div', { class: 'ws-search__icon', 'aria-hidden': 'true' }, [searchIconSvg()]);

  const inputRow = h('div', { class: 'ws-search__row' }, [icon, input, result, hint]);
  const root = h(
    'form',
    { class: 'ws-search ws-glass ws-motion-focus-glow', role: 'search', onsubmit: (e: Event) => e.preventDefault() },
    [inputRow, recentList]
  );

  return {
    root,
    input,
    setProviderHint(name) {
      if (hasInlineResult) return;
      hint.textContent = name ? `↵ ${name}` : '';
      hint.hidden = !name;
    },
    setInlineResult(text) {
      hasInlineResult = Boolean(text);
      result.textContent = text ?? '';
      result.hidden = !text;
      hint.hidden = hasInlineResult || !hint.textContent;
    },
    flashCopied() {
      result.classList.add('is-copied');
      const previous = result.textContent;
      result.textContent = 'Copied';
      window.setTimeout(() => {
        result.classList.remove('is-copied');
        result.textContent = previous;
      }, 700);
    },
    setPlaceholder(placeholder) {
      input.placeholder = placeholder;
    },
    setRecent(queries) {
      clearChildren(recentList);
      for (const query of queries) {
        recentList.append(
          h(
            'button',
            {
              class: 'ws-search__recent-item ws-motion-shimmer',
              type: 'button',
              onclick: () => callbacks.onPickRecent(query)
            },
            [recentIconSvg(), h('span', {}, [query])]
          )
        );
      }
      if (document.activeElement === input && !input.value.trim() && queries.length > 0) recentList.hidden = false;
      else if (queries.length === 0) recentList.hidden = true;
    }
  };
}

function searchIconSvg(): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');

  const circle = document.createElementNS(ns, 'circle');
  circle.setAttribute('cx', '11');
  circle.setAttribute('cy', '11');
  circle.setAttribute('r', '7');

  const line = document.createElementNS(ns, 'line');
  line.setAttribute('x1', '21');
  line.setAttribute('y1', '21');
  line.setAttribute('x2', '16.65');
  line.setAttribute('y2', '16.65');

  svg.append(circle, line);
  return svg;
}

function recentIconSvg(): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '14');
  svg.setAttribute('height', '14');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  const circle = document.createElementNS(ns, 'circle');
  circle.setAttribute('cx', '12');
  circle.setAttribute('cy', '12');
  circle.setAttribute('r', '8');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute('d', 'M12 8v4l2.5 2.5');
  svg.append(circle, path);
  return svg;
}
