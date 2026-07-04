import type { Application } from '@app/Application';
import { h } from '@core/dom/h';

/**
 * Bespoke UI for the wallpaper image library (upload + select + remove).
 * Everything else in the Wallpaper settings section renders generically —
 * this is the one deliberate exception, because "pick from a gallery of
 * images you've uploaded" doesn't map to any generic field type.
 */
export function renderWallpaperExtras(app: Application): HTMLElement {
  const grid = h('div', { class: 'ws-wallpaper-gallery' });

  const fileInput = h('input', {
    type: 'file',
    accept: 'image/*',
    class: 'ws-visually-hidden',
    tabindex: -1,
    onchange: async (event: Event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files?.[0]) {
        await app.wallpaper.addImage(files[0]);
        renderGrid();
      }
    }
  }) as HTMLInputElement;

  const uploadTile = h('button', { class: 'ws-wallpaper-gallery__upload', type: 'button', onclick: () => fileInput.click() }, ['+ Add image']);

  function renderGrid(): void {
    grid.replaceChildren(uploadTile);
    const active = app.settings.get<string>('wallpaper', 'activeImageId');
    for (const image of app.wallpaper.listImages()) {
      const tile = h('button', {
        class: `ws-wallpaper-gallery__tile${image.id === active ? ' is-active' : ''}`,
        type: 'button',
        style: `background-image:url(${image.dataUrl})`,
        title: image.name,
        onclick: () => {
          app.settings.set('wallpaper', 'mode', 'image');
          app.settings.set('wallpaper', 'activeImageId', image.id);
          renderGrid();
        }
      });
      const removeBtn = h('span', {
        class: 'ws-wallpaper-gallery__remove',
        onclick: async (event: Event) => {
          event.stopPropagation();
          await app.wallpaper.removeImage(image.id);
          renderGrid();
        }
      }, ['×']);
      tile.append(removeBtn);
      grid.append(tile);
    }
  }

  renderGrid();

  return h('div', { class: 'ws-field' }, [
    h('div', { class: 'ws-field__label-row' }, [h('span', { class: 'ws-field__label' }, ['Image library'])]),
    grid,
    fileInput
  ]);
}
