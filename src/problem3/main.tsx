// Dev page: stand-ins for the externals the task's code assumes, then render WalletPage.
import { useEffect, useRef, useSyncExternalStore } from 'react';
import { createRoot } from 'react-dom/client';
import WalletPage from './WalletPage';

const BALANCES = [
  { currency: 'ARB', amount: 10, blockchain: 'Arbitrum' },
  { currency: 'ETH', amount: 0.5, blockchain: 'Ethereum' },
  { currency: 'OSMO', amount: 100, blockchain: 'Osmosis' },
  { currency: 'ZIL', amount: 1234.5678, blockchain: 'Zilliqa' },
  { currency: 'ZERO', amount: 0, blockchain: 'Osmosis' },   // hidden: empty
  { currency: 'DOGE', amount: 5, blockchain: 'Dogechain' }, // hidden: unknown chain
  { currency: 'NEO', amount: 2, blockchain: 'Neo' },        // no price -> $0.00
];
const HIDDEN = [
  { currency: 'ZERO', why: 'empty balance' },
  { currency: 'DOGE', why: 'unranked chain' },
];
const CHAIN_OF = Object.fromEntries(BALANCES.map((b) => [b.currency, b.blockchain]));

// Price feed shared by every subscriber: a random walk, ticking once a second.
let prices: Record<string, number> = { ETH: 2000, OSMO: 1, ARB: 3, ZIL: 0.02 };
let ticks = 0;
const listeners = new Set<() => void>();
setInterval(() => {
  prices = Object.fromEntries(
    Object.entries(prices).map(([c, p]) => [c, p * (1 + (Math.random() - 0.5) * 0.02)])
  );
  ticks++;
  listeners.forEach((l) => l());
}, 1000);
const subscribe = (l: () => void) => (listeners.add(l), () => void listeners.delete(l));
const usePriceFeed = () => useSyncExternalStore(subscribe, () => prices);

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const CHAIN_BG: Record<string, string> = {
  Osmosis: 'from-violet-600 to-fuchsia-400',
  Ethereum: 'from-indigo-900 to-slate-400',
  Arbitrum: 'from-sky-400 to-slate-700',
  Zilliqa: 'from-teal-400 to-teal-700',
  Neo: 'from-emerald-400 to-teal-500',
};

function Row({ className, currency, amount, usdValue, formattedAmount }: any) {
  const prev = useRef(usdValue);
  const dir = usdValue > prev.current ? 'motion-safe:animate-flash-up' : usdValue < prev.current ? 'motion-safe:animate-flash-down' : '';
  useEffect(() => { prev.current = usdValue; });
  const chain = CHAIN_OF[currency];
  return (
    <div className={className} title={`${amount} ${currency}`}>
      <span className={`grid size-10 place-items-center rounded-full bg-linear-to-br text-[13px] font-bold text-white ${CHAIN_BG[chain] ?? 'from-slate-400 to-slate-500'}`}>
        {currency.slice(0, 2)}
      </span>
      <span className="flex flex-col">
        <strong>{currency}</strong>
        <small className="text-[13px] text-slate-500 dark:text-slate-400">{chain}</small>
      </span>
      <span className="text-right text-[13px] tabular-nums text-slate-500 max-[420px]:hidden dark:text-slate-400">{formattedAmount}</span>
      {/* key forces the flash animation to replay on every change */}
      <span key={usdValue} className={`min-w-24 rounded-md px-1.5 py-0.5 text-right font-semibold tabular-nums ${dir}`}>
        {usdValue ? usd.format(usdValue) : <em className="font-normal text-slate-500 dark:text-slate-400">no price</em>}
      </span>
    </div>
  );
}

const g = globalThis as any;
g.classes = {
  row: 'grid grid-cols-[40px_1fr_auto_auto] max-[420px]:grid-cols-[40px_1fr_auto] items-center gap-3 border-b border-slate-100 px-6 py-3 last:border-b-0 hover:bg-indigo-500/5 max-[420px]:px-4 dark:border-slate-800',
};
g.useWalletBalances = () => BALANCES;
g.usePrices = usePriceFeed;
g.WalletRow = Row;

function App() {
  const live = usePriceFeed();
  const total = BALANCES.reduce((sum, b) => sum + (b.amount > 0 ? (live[b.currency] ?? 0) * b.amount : 0), 0);
  return (
    <main className="mx-auto max-w-[480px] overflow-hidden rounded-[20px] bg-white shadow-xl shadow-slate-900/5 dark:bg-slate-900">
      <header className="bg-linear-135 from-indigo-500 to-violet-500 px-6 pt-7 pb-5 text-white">
        <p className="text-[13px] opacity-85">
          Portfolio value
          <span className="ml-2 text-[11px] tracking-widest uppercase">
            <span className="mr-1.5 inline-block size-[7px] rounded-full bg-emerald-300 motion-safe:animate-pulse" />live
          </span>
        </p>
        <h1 className="my-1 text-4xl font-bold tracking-tight tabular-nums">{usd.format(total)}</h1>
        <p className="text-[13px] opacity-85">{ticks} price updates · sorted by chain priority</p>
      </header>
      <WalletPage className="py-2" />
      <footer className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-6 py-4 text-xs text-slate-500 max-[420px]:px-4 dark:border-slate-800 dark:text-slate-400">
        <span className="w-full font-medium tracking-wide uppercase min-[421px]:w-auto">Hidden</span>
        {HIDDEN.map((h) => (
          <span key={h.currency} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 dark:bg-slate-800">
            <strong className="font-semibold text-slate-700 dark:text-slate-200">{h.currency}</strong>
            {h.why}
          </span>
        ))}
      </footer>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
