import { Application } from '@app/Application';
import { mountShell } from '@ui/shell/Shell';
import { h } from '@core/dom/h';

async function main(): Promise<void> {
  const app = new Application();
  await app.bootstrap();

  const root = document.getElementById('app');
  if (!root) throw new Error('#app root element missing');

  const skipLink = h('a', { class: 'ws-skip-link', href: '#ws-main' }, ['Skip to widgets']);
  document.body.prepend(skipLink);

  mountShell(root, app);

  app.bus.on('app:error', ({ source, error }) => {
    // eslint-disable-next-line no-console
    console.error(`[Workspace] Unhandled error in ${source}:`, error);
  });
}

void main();
