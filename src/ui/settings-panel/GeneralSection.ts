import type { Application } from '@app/Application';
import { h } from '@core/dom/h';

/**
 * Actions that aren't a single settings value — export/import, reset,
 * workspace switching — so they get a hand-built section instead of the
 * generic field renderer.
 */
export function renderGeneralSection(app: Application): HTMLElement {
  const workspaceButtons = app.layout.getWorkspaces().map((workspace) =>
    h(
      'button',
      {
        class: `ws-chip${workspace.id === app.layout.getActiveWorkspaceId() ? ' is-active' : ''}`,
        type: 'button',
        onclick: () => {
          app.layout.setActiveWorkspace(workspace.id);
          rerenderChips();
        }
      },
      [workspace.name]
    )
  );
  const workspaceRow = h('div', { class: 'ws-chip-row' }, workspaceButtons);

  function rerenderChips(): void {
    workspaceRow.replaceChildren(
      ...app.layout.getWorkspaces().map((workspace) =>
        h(
          'button',
          {
            class: `ws-chip${workspace.id === app.layout.getActiveWorkspaceId() ? ' is-active' : ''}`,
            type: 'button',
            onclick: () => {
              app.layout.setActiveWorkspace(workspace.id);
              rerenderChips();
            }
          },
          [workspace.name]
        )
      )
    );
  }

  const exportSettingsBtn = h('button', { class: 'ws-btn', type: 'button', onclick: () => download('workspace-settings.json', app.settings.export()) }, [
    'Export settings'
  ]);
  const exportLayoutBtn = h('button', { class: 'ws-btn', type: 'button', onclick: () => download('workspace-layout.json', app.layout.exportLayouts()) }, [
    'Export layout'
  ]);

  const importInput = h('input', {
    type: 'file',
    accept: 'application/json',
    class: 'ws-visually-hidden',
    onchange: async (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const text = await file.text();
      if (text.includes('"workspaces"')) await app.layout.importLayouts(text);
      else await app.settings.import(text);
      window.location.reload();
    }
  }) as HTMLInputElement;
  const importBtn = h('button', { class: 'ws-btn', type: 'button', onclick: () => importInput.click() }, ['Import…']);

  const resetBtn = h('button', { class: 'ws-btn ws-btn--danger', type: 'button', onclick: async () => {
    if (confirm('Reset every setting to its default? This can’t be undone.')) {
      await app.settings.resetAll();
      window.location.reload();
    }
  } }, ['Reset everything']);

  return h('div', { class: 'ws-general-section' }, [
    h('div', { class: 'ws-field' }, [h('div', { class: 'ws-field__label-row' }, [h('span', { class: 'ws-field__label' }, ['Workspace'])]), workspaceRow]),
    h('div', { class: 'ws-field' }, [
      h('div', { class: 'ws-field__label-row' }, [h('span', { class: 'ws-field__label' }, ['Import & export'])]),
      h('div', { class: 'ws-chip-row' }, [exportSettingsBtn, exportLayoutBtn, importBtn, importInput])
    ]),
    h('div', { class: 'ws-field' }, [resetBtn])
  ]);
}

function download(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
