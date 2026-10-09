# Problem 3: Messy React

The refactored component is in [WalletPage.tsx](./WalletPage.tsx).

Issues are grouped by severity. Each one says what is wrong, why it matters, and how to fix it.

## A. Bugs (the code is wrong)

### 1. `lhsPriority` is not defined
```ts
const balancePriority = getPriority(balance.blockchain);
if (lhsPriority > -99) {   // lhsPriority does not exist
```
TypeScript will not compile this, and if it ran it would throw a `ReferenceError`.
`balancePriority` is computed and never used.
**Fix:** use `balancePriority`.

### 2. The filter keeps the wrong balances
```ts
if (balance.amount <= 0) return true;
```
This keeps empty and negative balances and drops every positive one, so the page shows
only wallets with nothing in them. It is almost certainly inverted.
**Fix:** keep `priority > -99 && amount > 0`.

### 3. `blockchain` is not on `WalletBalance`
The code reads `balance.blockchain`, but the interface has no such field, so it does not type-check.
`getPriority(blockchain: any)` hides the problem instead of fixing it.
**Fix:** add `blockchain: string` to the interface and type the parameter as `string`. Do not use a closed union: the data can contain chains with no priority, which is what the `-99` default is for.

### 4. The sort comparator returns `undefined` for equal priorities
When priorities match, neither branch runs, so the function returns `undefined` instead of `0`.
A comparator must return a number for every pair. Without one the order is not guaranteed to be
stable or the same across engines.
**Fix:** `(a, b) => b.priority - a.priority`, which covers all three cases.

### 5. `formattedBalances` is computed but never used, so `formatted` is always `undefined`
`rows` maps over `sortedBalances` (plain `WalletBalance`s) but annotates each item as
`FormattedWalletBalance`. The annotation hides the mismatch, and `balance.formatted`
is `undefined` at runtime, so `WalletRow` gets no formatted amount.
It also wastes one full array map on every render.
**Fix:** build the formatted objects once and render rows from them.

### 6. `classes` is never defined
`classes.row` refers to a variable that is not in scope (no `useStyles()` or import).
**Fix:** import or create it (for example `const classes = useStyles()`).

### 7. A missing price gives `NaN`
`prices[balance.currency] * balance.amount` is `NaN` when a currency has no price yet,
which is common while prices are still loading.
**Fix:** `(prices[currency] ?? 0) * amount`, or skip or label the row.

### 8. `toFixed()` with no argument rounds to 0 decimals
`0.5 ETH` displays as `"1"` (and `0.4` as `"0"`). For token amounts this is misleading.
**Fix:** pass an explicit precision (`toFixed(2)`), or better, `Intl.NumberFormat`.

## B. Computational inefficiencies

### 9. `prices` is in the `useMemo` dependency list but not used inside it
Prices usually update often (polling or websocket). Each update throws away the memoized
value and re-runs the whole filter and sort, even though the result depends only on `balances`.
**Fix:** depend on `[balances]` only.

### 10. `getPriority` runs O(n log n) times inside `sort`
The comparator calls `getPriority` twice per comparison, and the filter calls it once more per item.
**Fix:** compute the priority once per balance (map to `{ balance, priority }`), then filter and sort on that.

### 11. `getPriority` is recreated on every render
It is a pure function of its argument and uses no props or state, yet it lives inside the component.
It is also used inside `useMemo` without being listed as a dependency, which
`react-hooks/exhaustive-deps` will flag.
**Fix:** move it (and the priority table) to module scope.

### 12. `rows` and `formattedBalances` are rebuilt on every render
Any re-render of the parent recreates every `WalletRow` element, even when balances and prices
have not changed.
**Fix:** memoize `rows` on `[sortedBalances, prices]`.

### 13. Several passes where one would do
filter → sort → map (format) → map (rows) creates several intermediate arrays. This is minor for small
lists, but formatting can be merged into the memoized pipeline so it runs only when balances change.

## C. React and TypeScript anti-patterns

### 14. `key={index}`
The list is filtered and sorted, so an item's index changes when the data changes. React then
reuses the wrong DOM node or component state for a row and does extra re-renders.
**Fix:** use a stable, unique key such as `` `${blockchain}-${currency}` ``.

### 15. `children` is pulled out and then dropped
`children` is removed from the props but never rendered, so anything passed inside
`<WalletPage>` silently disappears.
**Fix:** render it, or do not accept it.

### 16. Empty `interface Props extends BoxProps {}`
An empty interface adds nothing (and trips `@typescript-eslint/no-empty-interface`).
**Fix:** `type Props = BoxProps`.

### 17. Redundant type annotations
`React.FC<Props> = (props: Props)` repeats the type. Inline annotations such as
`(balance: WalletBalance)` and `(balance: FormattedWalletBalance)` are not needed once the
source array is typed, and the second one hid bug #5.
**Fix:** type the data at the source and let inference do the rest.

### 18. A `switch` used as a lookup table, with a magic number
The `switch` is a static mapping, and `Zilliqa` and `Neo` are duplicate branches. `-99` is a
magic number repeated in two places.
**Fix:** use a `Record<string, number>` map and a named `UNKNOWN_PRIORITY` constant.

### 19. `FormattedWalletBalance` repeats the fields of `WalletBalance`
**Fix:** `interface FormattedWalletBalance extends WalletBalance { formatted: string }`.

### 20. Mixed tabs and spaces
The indentation is inconsistent, which makes the code hard to read and review. Run a formatter (Prettier).

## Refactored version

See [WalletPage.tsx](./WalletPage.tsx). Summary of the changes:

- `getPriority` and the priority table are at module scope, and the lookup uses a `Record`
- filter, sort and format run in one memoized pipeline that depends only on `balances`
- priority is computed once per item, and the comparator is `b.priority - a.priority`
- the filter logic is corrected (`priority > -99 && amount > 0`)
- `rows` is memoized on `[sortedBalances, prices]` and uses stable keys
- a missing price no longer gives `NaN`, and `children` is rendered
- `WalletRow` also gets `currency`: without it a row cannot show which coin it is

## Running it

The task doesn't include `BoxProps`, `useWalletBalances`, `usePrices`, `WalletRow` or `classes`.
[globals.d.ts](./globals.d.ts) declares their types, and the test stubs them at runtime.

```sh
npm install
npm run dev   # open the printed URL to see the page in a browser (stand-in data from main.tsx)
npm test      # tsc --noEmit, then renders WalletPage to HTML and checks the output
```
