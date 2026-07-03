import { h } from '@core/dom/h';

export interface SearchView {
  root: HTMLElement;
  input: HTMLInputElement;
  setProviderHint(name: string | null): void;
  setPlaceholder(placeholder: string): void;
}

export function createSearchView(onSubmit: (query: string) => void): SearchView {
  const hint = h('span', { class: 'ws-search__hint' });
  const input = h('input', {
    class: 'ws-search__input',
    type: 'text',
    autocomplete: 'off',
    spellcheck: false,
    'aria-label': 'Search the web'
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && input.value.trim().length > 0) {
      onSubmit(input.value.trim());
      input.value = '';
    }
  });

  const icon = h('div', { class: 'ws-search__icon', 'aria-hidden': 'true' }, [searchIconSvg()]);

  const root = h('form', { class: 'ws-search ws-glass', role: 'search', onsubmit: (e: Event) => e.preventDefault() }, [
    icon,
    input,
    hint
  ]);

  return {
    root,
    input,
    setProviderHint(name) {
      hint.textContent = name ? `↵ ${name}` : '';
      hint.hidden = !name;
    },
    setPlaceholder(placeholder) {
      input.placeholder = placeholder;
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
