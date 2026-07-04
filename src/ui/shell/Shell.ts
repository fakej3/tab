import type { Application } from '@app/Application';
import { h, clearChildren } from '@core/dom/h';
import { icons } from '@core/dom/icons';
import { CommandPaletteView } from '@ui/command-palette/CommandPaletteView';
import { SettingsPanel } from '@ui/settings-panel/SettingsPanel';
import { LayoutCanvas } from './LayoutCanvas';
import './styles.css';

const MOTION_BTN = 'ws-chrome__btn ws-motion-press';

/**
 * Assembles the visible app: wallpaper (backmost), the widget layout
 * canvas, the settings panel + command palette overlays, and the minimal
 * chrome (settings/edit-layout buttons, workspace switcher). This is
 * composition only — all behavior lives in the engines it wires together.
 */
export function mountShell(root: HTMLElement, app: Application): void {
  const wallpaperContainer = h('div', { class: 'ws-wallpaper' });
  const ambienceContainer = h('div', { class: 'ws-ambience' });
  const layoutContainer = h('div', { id: 'ws-main', tabindex: -1 });
  const workspaceSwitcher = h('div', { class: 'ws-workspace-switcher ws-glass' });

  const editModeBtn = h(
    'button',
    { class: MOTION_BTN, type: 'button', 'aria-label': 'Edit layout', onclick: () => app.layout.setEditMode(!app.layout.isEditMode()) },
    [icons.layoutEdit()]
  );
  const settingsBtn = h('button', { class: MOTION_BTN, type: 'button', 'aria-label': 'Open settings', onclick: () => settingsPanel.open() }, [
    icons.gear()
  ]);
  const chrome = h('div', { class: 'ws-chrome ws-glass' }, [editModeBtn, settingsBtn]);

  const shell = h('div', { class: 'ws-shell' }, [wallpaperContainer, ambienceContainer, layoutContainer, chrome, workspaceSwitcher]);
  root.append(shell);

  app.wallpaper.mount(wallpaperContainer);
  app.ambience.mount(ambienceContainer);
  new LayoutCanvas(layoutContainer, app);

  const settingsPanel = new SettingsPanel(app);
  settingsPanel.mount(root);

  const commandPaletteView = new CommandPaletteView(app);
  commandPaletteView.mount(root);

  app.layout.subscribeEditMode((enabled) => editModeBtn.classList.toggle('is-active', enabled));

  // Dim the wallpaper a touch while a focus-stealing overlay is open — a
  // cheap way to direct attention to the palette/settings without changing
  // either of their own styling. Shell owns this (not WallpaperEngine)
  // because it's a cross-cutting UI concern, not a wallpaper concern.
  let overlaysOpen = 0;
  function adjustDimming(delta: number): void {
    overlaysOpen = Math.max(0, overlaysOpen + delta);
    wallpaperContainer.classList.toggle('is-dimmed', overlaysOpen > 0);
  }
  app.bus.on('command-palette:open', () => adjustDimming(1));
  app.bus.on('command-palette:close', () => adjustDimming(-1));
  app.bus.on('settings-panel:open', () => adjustDimming(1));
  app.bus.on('settings-panel:close', () => adjustDimming(-1));

  // Search gets its own, lighter touch of dimming — it's the emotional
  // center of the interface, not a modal overlay, so the effect is subtler
  // than the palette/settings treatment above.
  app.bus.on('search:focus', () => wallpaperContainer.classList.add('is-focus-dimmed'));
  app.bus.on('search:blur', () => wallpaperContainer.classList.remove('is-focus-dimmed'));

  renderWorkspaceSwitcher();
  app.layout.subscribe(renderWorkspaceSwitcher);

  function renderWorkspaceSwitcher(): void {
    clearChildren(workspaceSwitcher);
    for (const workspace of app.layout.getWorkspaces()) {
      workspaceSwitcher.append(
        h(
          'button',
          {
            class: `ws-workspace-switcher__item${workspace.id === app.layout.getActiveWorkspaceId() ? ' is-active' : ''}`,
            type: 'button',
            onclick: () => app.layout.setActiveWorkspace(workspace.id)
          },
          [workspace.name]
        )
      );
    }
  }

  registerCoreCommands(app, settingsPanel);
}

function registerCoreCommands(app: Application, settingsPanel: SettingsPanel): void {
  const registry = app.commandPalette.registry;

  registry.register({ id: 'open-settings', title: 'Open Settings', group: 'Workspace', perform: () => settingsPanel.open() });
  registry.register({
    id: 'toggle-edit-layout',
    title: 'Toggle Edit Layout',
    group: 'Workspace',
    perform: () => app.layout.setEditMode(!app.layout.isEditMode())
  });
  registry.register({
    id: 'reset-theme',
    title: 'Reset Theme to Default',
    group: 'Theme',
    perform: () => void app.settings.resetSection('theme')
  });

  for (const workspace of app.layout.getWorkspaces()) {
    registry.register({
      id: `switch-workspace-${workspace.id}`,
      title: `Switch to “${workspace.name}” Workspace`,
      group: 'Workspace',
      keywords: ['workspace', workspace.name],
      perform: () => app.layout.setActiveWorkspace(workspace.id)
    });
  }

  for (const preset of ['midnight-glass', 'daybreak', 'nordic', 'ember', 'mono']) {
    registry.register({
      id: `theme-preset-${preset}`,
      title: `Theme: ${preset.replace('-', ' ')}`,
      group: 'Theme',
      perform: () => app.settings.set('theme', 'preset', preset)
    });
  }

  for (const preset of ['minimal', 'editorial', 'modern', 'elegant', 'swiss', 'classic', 'monospace']) {
    registry.register({
      id: `typography-preset-${preset}`,
      title: `Typography: ${preset}`,
      group: 'Typography',
      perform: () => app.settings.set('typography', 'preset', preset)
    });
  }
}
