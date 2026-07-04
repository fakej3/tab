const NS = 'http://www.w3.org/2000/svg';

function buildSvg(paths: string[], attrs: Record<string, string> = {}): SVGSVGElement {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', '18');
  svg.setAttribute('height', '18');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.75');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  for (const [key, value] of Object.entries(attrs)) svg.setAttribute(key, value);
  for (const d of paths) {
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('d', d);
    svg.append(path);
  }
  return svg;
}

export const icons = {
  gear: () =>
    buildSvg([
      'M12 15a3 3 0 100-6 3 3 0 000 6z',
      'M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z'
    ]),
  layoutEdit: () => buildSvg(['M3 5h18M3 12h18M3 19h10']),
  search: () => buildSvg(['M11 19a8 8 0 100-16 8 8 0 000 16z', 'M21 21l-4.35-4.35']),
  close: () => buildSvg(['M18 6L6 18', 'M6 6l12 12']),
  reset: () => buildSvg(['M3 12a9 9 0 109-9 9.75 9.75 0 00-6.74 2.74L3 8', 'M3 3v5h5']),
  lock: () =>
    buildSvg(['M6 11V8a6 6 0 1112 0v3', 'M5 11h14v9H5z'], { width: '14', height: '14', 'stroke-width': '2' }),
  unlock: () =>
    buildSvg(['M6 11V8a6 6 0 0111.6-2.2', 'M5 11h14v9H5z'], { width: '14', height: '14', 'stroke-width': '2' }),
  eye: () =>
    buildSvg(['M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z', 'M12 15a3 3 0 100-6 3 3 0 000 6z'], {
      width: '14',
      height: '14',
      'stroke-width': '2'
    }),
  eyeOff: () =>
    buildSvg(
      [
        'M3 3l18 18',
        'M10.6 5.2A10.6 10.6 0 0112 5c6.4 0 10 7 10 7a17.6 17.6 0 01-3.2 4.2M6.6 6.6C3.9 8.3 2 12 2 12s3.6 7 10 7a9.7 9.7 0 004.4-1',
        'M9.9 10a3 3 0 004.2 4.2'
      ],
      { width: '14', height: '14', 'stroke-width': '2' }
    ),
  cloud: () => buildSvg(['M6.5 19a4.5 4.5 0 010-9 6 6 0 0111.4 2.1A4 4 0 0117 19H6.5z']),
  bookmark: () => buildSvg(['M6 3h12v18l-6-4.5L6 21z']),
  sparkle: () =>
    buildSvg(['M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z'], { 'stroke-linejoin': 'round', fill: 'currentColor', stroke: 'none' })
};
