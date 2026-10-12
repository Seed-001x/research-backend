// src/crawlers/whale.js — tracks smart money wallets for accumulation patterns
// Uses Helius enhanced transactions API (same as ALPHABOT's discovery).

const whaleMoves = [];
const MAX_MOVES = 500;

// Curated smart money wallets — top FOMO traders by PnL (Oct 2026)
// Source: fomoapi.io leaderboard + Banana Gun research
const DEFAULT_WALLETS = [
  { handle: '@DumbCrayonEater', mint: '5FGoPPj1nL8LCnfVnpTmreqQtqLuMXXAwuS1uahMrp8V', pnl: 3867825 },
  { handle: '@unipcs', mint: '2heJbC32Tpfcb3nbUb5ER61K11FGZVfVGtVnDm6LDogF', pnl: 3425639 },
  { handle: '@change', mint: 'J9WiAZKf8JnCkHFL8fLCCXdEgdoLjLRqU2EGsDjdqYga', pnl: 2859079 },
  { handle: '@PoorGoat_', mint: 'HDixbrzwwLXczhDBk1JVrurPQsuLE8FUKnW2pucSXN3o', pnl: 2526377 },
  { handle: '@Salem1299534', mint: '2yXwy5Dsa1XtEXcsrkFVRJeyuWD3qKkMN3pP3p5VTW3V', pnl: 2424660 },
  { handle: '@frankdegods', mint: '498g1rVnFcnjBjpfw1xyqA1WvgQXUU8RWuELjxkjAayQ', pnl: 1992632 },
  { handle: '@ether_monk', mint: '2xUbYAVq1oJGj45d6JjnaYHAke3NQecUcqWvvVbwmYw8', pnl: 1936423 },
  { handle: '@brrrgrrrz', mint: 'GFRjGNXY8JrGSPC46inqrH4XPdUFMDLkE1oNm1nXiPsJ', pnl: 1745070 },
  { handle: '@pointfarmcap', mint: 'Beqv6dzTcjV2eodo8RRXCiCcnSYrS1vkQKhfqwHXqeit', pnl: 10000000 },
  { handle: '@The__Solstice', mint: '4ugDhHJ8XDXAeABmrNmGffFaLbJb9BkPyiFGVSV9ocwo', pnl: 7200000 },
  // GMGN 7D top traders (Oct 2026) — hot right now
  { handle: 'GMGN:decu', mint: '4vw54BmAogeRV3vPKWyFet5yf8DTLcREzdSzx4rw9Ud9', pnl: 162900, note: '65.7% WR, 14K txns' },
  { handle: 'GMGN:OGAntD', mint: '215nhcAHjQQGgwpQSJQ7zR26etbjjtVdW74NLzwEgQjP', pnl: 90400, note: '+51.9% 7D' },
  { handle: 'GMGN:Cooker', mint: '8deJ9xeUvXSJwicYptA9mHsU2rN2pDx37KWzkDkEXhU6', pnl: 89400, note: '72% WR' },
  { handle: 'GMGN:theo', mint: 'Bi4rd5FH5bYEN8scZ7wevxNZyNmKHdaBcvewdPFxYdLt', pnl: 77400, note: '54.9% WR' },
  { handle: 'GMGN:trunoest', mint: 'ardinRsN1mNYVeoJWTBsWeYeXvuR9UUDGMsCDKpb6AT', pnl: 69000, note: '55.9% WR' },
  { handle: 'GMGN:Limfork', mint: 'BQVz7fQ1WsQmSTMY3umdPEPPTm1sdcBcX9sP7o6kPRmB', pnl: 63000 },
  { handle: 'GMGN:Ashtoshii', mint: '8MoW9mtbEz6z3gPuAdYb1yWhjCAxQSYqpcTb1CQgN5qb', pnl: 33900, note: '+58.5% 7D' },
  { handle: 'GMGN:Daumen', mint: '8MaVa9kdt3NW4Q5HyNAm1X5LbR8PQRVDc1W8NMVK88D5', pnl: 16900 },
];

let trackedWallets = [...DEFAULT_WALLETS];

export function setTrackedWallets(wallets) {
  trackedWallets = wallets;
}

export function getTrackedWallets() {
  return trackedWallets.map(w => ({ handle: w.handle, mint: w.mint, pnl: w.pnl }));
}

export function recordWhaleMove(move) {
  whaleMoves.push({ ...move, ts: Date.now(), id: Math.random().toString(36).slice(2) });
  if (whaleMoves.length > MAX_MOVES) whaleMoves.shift();
}

export function getWhaleMoves(limit = 50) {
  return whaleMoves.slice(-limit).reverse();
}

export function getAccumulationSignals() {
  // Find tokens where 3+ tracked wallets bought in last 24h
  const now = Date.now();
  const byToken = {};
  for (const m of whaleMoves) {
    if (now - m.ts > 86400000 || m.side !== 'buy') continue;
    if (!byToken[m.mint]) byToken[m.mint] = { wallets: new Set(), symbol: m.symbol, totalUsd: 0 };
    byToken[m.mint].wallets.add(m.wallet);
    byToken[m.mint].totalUsd += m.usdValue || 0;
  }
  return Object.entries(byToken)
    .filter(([_, v]) => v.wallets.size >= 2)
    .map(([mint, v]) => ({
      mint, symbol: v.symbol,
      walletCount: v.wallets.size,
      totalUsd: Math.round(v.totalUsd),
      signal: v.wallets.size >= 3 ? 'strong' : 'building',
    }))
    .sort((a, b) => b.walletCount - a.walletCount);
}

export async function crawlWhales() {
  const heliusKey = process.env.HELIUS_API_KEY;
  if (!heliusKey) {
    console.log('[whale] HELIUS_API_KEY not set — tracking', trackedWallets.length, 'wallets (need key for live data)');
    return;
  }
  if (!trackedWallets.length) {
    console.log('[whale] no wallets configured');
    return;
  }
  console.log(`[whale] crawling ${trackedWallets.length} wallets via Helius`);
  for (const w of trackedWallets) {
    try {
      const r = await fetch(
        `https://api.helius.xyz/v0/addresses/${w.mint}/transactions?api-key=${heliusKey}&limit=10`,
        { signal: AbortSignal.timeout(10000) }
      );
      if (!r.ok) continue;
      const txns = await r.json();
      for (const tx of txns || []) {
        // Parse swap transactions for buy/sell signals
        // TODO: full parsing — for now log that we're getting data
      }
    } catch {}
    // Rate limit: small delay between wallets
    await new Promise(r => setTimeout(r, 200));
  }
}
