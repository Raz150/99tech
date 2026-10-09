# Problem 3: Messy React

Refactored component: [WalletPage.tsx](./WalletPage.tsx)

## Main issues

**Bugs**
- `lhsPriority` is undefined, so the code does not compile; it should be `balancePriority`.
- The filter keeps `amount <= 0`, which is inverted: it hides every positive balance.
- `blockchain` is missing from `WalletBalance`, and `getPriority(any)` hides that.
- The sort comparator returns `undefined` for equal priorities instead of `0`.
- `formattedBalances` is never used, so `rows` reads `formatted` from unformatted data and gets `undefined`.
- A missing price gives `NaN`, `toFixed()` rounds to 0 decimals, and `classes` is undefined.

**Inefficiencies**
- `prices` is a `useMemo` dependency but is not used inside it, so every price tick re-filters and re-sorts.
- `getPriority` runs O(n log n) times inside `sort`; it should be computed once per item.
- `getPriority` is recreated on every render; it is pure, so it can live at module scope.

**Anti-patterns**
- `key={index}` on a sorted and filtered list; use a stable key such as `blockchain-currency`.
- `children` is pulled out of props and never rendered.
- Empty `interface Props extends BoxProps {}`, a `switch` used as a lookup table, and a magic `-99`.

## Run

```sh
npm install
npm run dev   # demo page with live mock prices
npm test      # type check and render test
```
