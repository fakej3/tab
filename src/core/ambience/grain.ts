/**
 * A tiny tiled film-grain texture built from an SVG `feTurbulence` filter —
 * no binary asset, no runtime canvas generation, scales to any resolution.
 * Desaturated (feColorMatrix saturate=0) so it reads as neutral grain
 * regardless of the active theme.
 */
const GRAIN_SVG = `<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'>
  <filter id='n'>
    <feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch' result='noise'/>
    <feColorMatrix in='noise' type='saturate' values='0'/>
  </filter>
  <rect width='100%' height='100%' filter='url(#n)'/>
</svg>`;

export const GRAIN_BACKGROUND_IMAGE = `url("data:image/svg+xml,${encodeURIComponent(GRAIN_SVG)}")`;
