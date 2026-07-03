import { h } from '@core/dom/h';
import type { Quote } from './constants';

export interface QuoteViewCallbacks {
  onToggleFavorite(): void;
  onAddCustom(text: string, author: string): void;
}

export interface QuoteView {
  root: HTMLElement;
  render(quote: Quote | null, isFavorite: boolean, showAuthor: boolean): void;
}

export function createQuoteView(callbacks: QuoteViewCallbacks): QuoteView {
  const textEl = h('p', { class: 'ws-quotes__text' });
  const authorEl = h('cite', { class: 'ws-quotes__author' });

  const favoriteBtn = h(
    'button',
    { class: 'ws-quotes__action', type: 'button', 'aria-label': 'Favorite this quote', onclick: () => callbacks.onToggleFavorite() },
    [heartIcon()]
  );

  const addForm = h('div', { class: 'ws-quotes__add', hidden: true });
  const addInput = h('input', { class: 'ws-quotes__add-input', placeholder: 'Your quote…', type: 'text' });
  const addAuthorInput = h('input', { class: 'ws-quotes__add-author', placeholder: 'Author (optional)', type: 'text' });
  addForm.append(addInput, addAuthorInput);

  addInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && addInput.value.trim()) {
      callbacks.onAddCustom(addInput.value.trim(), addAuthorInput.value.trim() || 'Anonymous');
      addInput.value = '';
      addAuthorInput.value = '';
      addForm.hidden = true;
    }
  });

  const addBtn = h(
    'button',
    { class: 'ws-quotes__action', type: 'button', 'aria-label': 'Add your own quote', onclick: () => {
      addForm.hidden = !addForm.hidden;
      if (!addForm.hidden) addInput.focus();
    } },
    ['+']
  );

  const actions = h('div', { class: 'ws-quotes__actions' }, [favoriteBtn, addBtn]);
  const root = h('div', { class: 'ws-quotes' }, [textEl, authorEl, actions, addForm]);

  function render(quote: Quote | null, isFavorite: boolean, showAuthor: boolean): void {
    textEl.textContent = quote ? `“${quote.text}”` : 'Add your first quote with the + button.';
    authorEl.textContent = quote && showAuthor ? `— ${quote.author}` : '';
    authorEl.hidden = !quote || !showAuthor;
    favoriteBtn.classList.toggle('is-active', isFavorite);
    favoriteBtn.hidden = !quote;
  }

  return { root, render };
}

function heartIcon(): SVGSVGElement {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '15');
  svg.setAttribute('height', '15');
  svg.setAttribute('fill', 'currentColor');
  const path = document.createElementNS(ns, 'path');
  path.setAttribute(
    'd',
    'M12 21s-7.5-4.6-10-9.1C.4 8.6 2 5 5.6 5c2 0 3.4 1 4.4 2.4C11 6 12.4 5 14.4 5 18 5 19.6 8.6 22 11.9 19.5 16.4 12 21 12 21z'
  );
  svg.append(path);
  return svg;
}
