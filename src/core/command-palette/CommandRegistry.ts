export interface Command {
  id: string;
  title: string;
  subtitle?: string;
  group: string;
  keywords?: string[];
  perform: () => void;
}

/**
 * Flat registry of every command any core service or plugin exposes to the
 * command palette. Plugins register commands the same way they register
 * settings — through their `PluginContext` — so the palette never needs to
 * know what a plugin is.
 */
export class CommandRegistry {
  private commands = new Map<string, Command>();

  register(command: Command): () => void {
    this.commands.set(command.id, command);
    return () => this.commands.delete(command.id);
  }

  unregister(id: string): void {
    this.commands.delete(id);
  }

  all(): Command[] {
    return [...this.commands.values()];
  }

  search(query: string): Command[] {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return this.all();

    const scored = this.all()
      .map((command) => ({ command, score: score(command, trimmed) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.map((entry) => entry.command);
  }
}

function score(command: Command, query: string): number {
  const haystacks = [command.title, command.subtitle ?? '', ...(command.keywords ?? [])].map((s) => s.toLowerCase());
  let best = 0;
  for (const haystack of haystacks) {
    if (haystack === query) best = Math.max(best, 100);
    else if (haystack.startsWith(query)) best = Math.max(best, 75);
    else if (haystack.includes(query)) best = Math.max(best, 40);
  }
  return best;
}
