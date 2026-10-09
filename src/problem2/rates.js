// The feed has duplicate currencies; keep the most recent price for each, dropping invalid ones.
export function latestPrices(rows) {
  const best = new Map();
  for (const r of rows) {
    if (!(r.price > 0)) continue;
    const prev = best.get(r.currency);
    if (!prev || new Date(r.date) >= new Date(prev.date)) best.set(r.currency, r);
  }
  return new Map([...best].map(([c, r]) => [c, r.price]));
}

// Both prices are in USD, so the cross rate is a simple ratio.
export const convert = (amount, fromPrice, toPrice) => (amount * fromPrice) / toPrice;
