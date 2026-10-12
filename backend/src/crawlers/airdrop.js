// src/crawlers/airdrop.js — tracks upcoming TGEs, testnets, points programs

const opportunities = [];
const MAX_OPPS = 200;

export function recordAirdropOpp(o) {
  opportunities.push({ ...o, ts: Date.now(), id: Math.random().toString(36).slice(2) });
  if (opportunities.length > MAX_OPPS) opportunities.shift();
}

export function getAirdropOpps(limit = 50) {
  return opportunities
    .filter(o => !o.expired)
    .slice(-limit)
    .reverse();
}

export async function crawlAirdrops() {
  console.log('[airdrop] crawl cycle — scanning for TGEs and farming opps');
  // TODO: monitor:
  // - New L1/L2 testnets with confirmed airdrops
  // - Points programs (early = more allocation)
  // - Galxe/Zealy quests for upcoming tokens
  // - Bridge/volume farming on new chains
}
