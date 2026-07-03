import { h } from '@core/dom/h';

export interface NotesView {
  root: HTMLElement;
  textarea: HTMLTextAreaElement;
  setFont(font: string): void;
}

export function createNotesView(onChange: (value: string) => void): NotesView {
  const textarea = h('textarea', {
    class: 'ws-notes__textarea',
    placeholder: 'Jot something down…',
    oninput: (event: Event) => onChange((event.target as HTMLTextAreaElement).value)
  }) as HTMLTextAreaElement;

  const root = h('div', { class: 'ws-notes' }, [textarea]);

  return {
    root,
    textarea,
    setFont(font: string) {
      textarea.dataset.font = font;
    }
  };
}
