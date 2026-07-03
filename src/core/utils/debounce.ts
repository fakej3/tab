export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delayMs: number
): (...args: Args) => void {
  let handle: ReturnType<typeof setTimeout> | undefined;
  return (...args: Args) => {
    if (handle) clearTimeout(handle);
    handle = setTimeout(() => fn(...args), delayMs);
  };
}

export function throttle<Args extends unknown[]>(
  fn: (...args: Args) => void,
  intervalMs: number
): (...args: Args) => void {
  let last = 0;
  let trailingHandle: ReturnType<typeof setTimeout> | undefined;
  return (...args: Args) => {
    const now = performance.now();
    const remaining = intervalMs - (now - last);
    if (remaining <= 0) {
      last = now;
      fn(...args);
    } else {
      clearTimeout(trailingHandle);
      trailingHandle = setTimeout(() => {
        last = performance.now();
        fn(...args);
      }, remaining);
    }
  };
}
