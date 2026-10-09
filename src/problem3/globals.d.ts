// Types for the pieces the task's code uses but does not define.
import type { HTMLAttributes, ComponentType } from 'react';

declare global {
  type BoxProps = HTMLAttributes<HTMLDivElement>;
  function useWalletBalances(): { currency: string; amount: number; blockchain: string }[];
  function usePrices(): Record<string, number>;
  const WalletRow: ComponentType<{
    className?: string;
    currency: string;
    amount: number;
    usdValue: number;
    formattedAmount: string;
  }>;
  const classes: { row: string };
}
