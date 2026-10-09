import React, { useMemo } from 'react';
// Assumed to exist in the original project (not shown in the task):
// BoxProps, useWalletBalances, usePrices, WalletRow, classes

interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string; // was missing, yet the original code reads it; may be a chain we don't rank
}

interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
}

// Static data lives outside the component: created once, not on every render.
const PRIORITY: Record<string, number> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
};
const UNKNOWN_PRIORITY = -99;

const getPriority = (blockchain: string): number =>
  PRIORITY[blockchain] ?? UNKNOWN_PRIORITY;

type Props = BoxProps;

const WalletPage: React.FC<Props> = ({ children, ...rest }) => {
  const balances: WalletBalance[] = useWalletBalances();
  const prices: Record<string, number> = usePrices();

  // Depends only on balances, so a price tick does not re-filter / re-sort.
  const sortedBalances = useMemo<FormattedWalletBalance[]>(
    () =>
      balances
        // compute priority once per item instead of O(n log n) times inside sort
        .map((balance) => ({ balance, priority: getPriority(balance.blockchain) }))
        .filter(({ balance, priority }) => priority > UNKNOWN_PRIORITY && balance.amount > 0)
        .sort((lhs, rhs) => rhs.priority - lhs.priority)
        .map(({ balance }) => ({ ...balance, formatted: balance.amount.toFixed(2) })),
    [balances]
  );

  const rows = useMemo(
    () =>
      sortedBalances.map((balance) => (
        <WalletRow
          className={classes.row}
          key={`${balance.blockchain}-${balance.currency}`}
          currency={balance.currency}
          amount={balance.amount}
          usdValue={(prices[balance.currency] ?? 0) * balance.amount}
          formattedAmount={balance.formatted}
        />
      )),
    [sortedBalances, prices]
  );

  return (
    <div {...rest}>
      {rows}
      {children}
    </div>
  );
};

export default WalletPage;
