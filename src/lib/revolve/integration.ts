/** Simpson's rule — accurate enough for AP-style numeric answers */
export function integrateSimpson(
  fn: (x: number) => number,
  a: number,
  b: number,
  segments = 400
): number {
  if (a === b) return 0;
  if (a > b) return -integrateSimpson(fn, b, a, segments);

  let n = Math.max(40, Math.floor(segments / 2) * 2);
  const h = (b - a) / n;
  let sum = fn(a) + fn(b);

  for (let i = 1; i < n; i++) {
    const x = a + i * h;
    const coeff = i % 2 === 0 ? 2 : 4;
    sum += coeff * fn(x);
  }

  return (h / 3) * sum;
}

export function formatNumber(n: number, decimals = 4): string {
  if (!Number.isFinite(n)) return "undefined";
  const rounded = Number(n.toFixed(decimals));
  return rounded.toLocaleString("en-US", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  });
}
