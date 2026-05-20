/** Washer radii for rotation around the x-axis (y = 0) */
export function washerRadiiXAxis(f: number, g: number): { R: number; r: number } {
  const top = Math.max(f, g);
  const bottom = Math.min(f, g);

  if (bottom >= 0) return { R: top, r: bottom };
  if (top <= 0) return { R: Math.abs(bottom), r: Math.abs(top) };

  return { R: Math.max(Math.abs(f), Math.abs(g)), r: 0 };
}

/** Washer radii for rotation around horizontal line y = k */
export function washerRadiiHorizontal(
  f: number,
  g: number,
  k: number
): { R: number; r: number } {
  const ymin = Math.min(f, g);
  const ymax = Math.max(f, g);

  if (k >= ymin && k <= ymax) {
    return { R: Math.max(ymax - k, k - ymin), r: 0 };
  }

  const dTop = Math.abs(ymax - k);
  const dBottom = Math.abs(ymin - k);
  return { R: Math.max(dTop, dBottom), r: Math.min(dTop, dBottom) };
}
