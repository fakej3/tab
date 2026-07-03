const STYLE = 'color:#8b7cf6;font-weight:600';

export interface Logger {
  info(message: string, ...rest: unknown[]): void;
  warn(message: string, ...rest: unknown[]): void;
  error(message: string, ...rest: unknown[]): void;
}

export function createLogger(scope: string): Logger {
  const tag = `%c[${scope}]`;
  return {
    info: (message, ...rest) => console.info(tag, STYLE, message, ...rest),
    warn: (message, ...rest) => console.warn(tag, STYLE, message, ...rest),
    error: (message, ...rest) => console.error(tag, STYLE, message, ...rest)
  };
}
