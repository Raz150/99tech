# Fancy Form — currency swap

Vanilla JS + [Vite](https://vite.dev/), styled with the [Tailwind CSS](https://tailwindcss.com/) Play CDN.

```sh
npm install
npm run dev     # http://localhost:5173
npm run build   # production build in dist/
npm test        # price/conversion helpers
```

- Live prices from `interview.switcheo.com/prices.json` (latest entry per token; tokens without a price are omitted).
- Type in either field; the other updates. Flip button swaps the pair.
- Searchable token picker (Enter picks the first match). Picking the token on the other side flips the pair.
- Input validation, USD values, exchange rate, loading state, and a toast on success. The swap itself is simulated.
