import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import WalletPage from './WalletPage';

// Stub the externals the component expects to find in scope.
const g = globalThis as any;
g.classes = { row: 'row' };
g.WalletRow = (p: any) => <p className={p.className}>{p.formattedAmount}|{p.usdValue}</p>;
g.usePrices = () => ({ ETH: 2000, OSMO: 1, ARB: 3 });
g.useWalletBalances = () => [
  { currency: 'ARB', amount: 10, blockchain: 'Arbitrum' },
  { currency: 'ETH', amount: 0.5, blockchain: 'Ethereum' },
  { currency: 'OSMO', amount: 100, blockchain: 'Osmosis' },
  { currency: 'ZERO', amount: 0, blockchain: 'Osmosis' },    // dropped: empty
  { currency: 'DOGE', amount: 5, blockchain: 'Dogechain' },  // dropped: unknown chain
  { currency: 'NEO', amount: 2, blockchain: 'Neo' },         // no price -> usd 0, not NaN
];

const html = renderToStaticMarkup(<WalletPage id="wallet"><span>child</span></WalletPage>);
console.log(html);

assert.equal(
  html,
  '<div id="wallet">' +
    '<p class="row">100.00|100</p>' +   // Osmosis 100
    '<p class="row">0.50|1000</p>' +    // Ethereum 50
    '<p class="row">10.00|30</p>' +     // Arbitrum 30
    '<p class="row">2.00|0</p>' +       // Neo 20
    '<span>child</span>' +
  '</div>'
);
console.log('ok');
