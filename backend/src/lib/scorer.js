// src/lib/scorer.js — opportunity scorer: 1-100 on 10-20x potential
// Synthesizes across all crawler findings.

import { getNarrativeHeat } from '../crawlers/narrative.js';
import { getAccumulationSignals } from '../crawlers/whale.js';

const scoredOpps = [];
const MAX_SCORED = 300;

export function scoreOpportunity(opp) {
  let score = 50; // baseline
  const reasons = [];

  // Narrative alignment (+0-20)
  const heat = getNarrativeHeat();
  // TODO: match opp keywords against heat

  // Whale accumulation (+0-25)
  const whaleSignals = getAccumulationSignals();
  const whaleHit = whaleSignals.find(w => w.mint === opp.mint);
  if (whaleHit) {
    const pts = whaleHit.signal === 'strong' ? 25 : 15;
    score += pts;
    reasons.push(`${whaleHit.walletCount} whales accumulating (+${pts})`);
  }

  // Fresh narrative (+0-15)
  // TODO: narrative heat bonus

  // Airdrop proximity (+0-10)
  // TODO: TGE timing bonus

  score = Math.max(1, Math.min(100, Math.round(score)));

  const scored = { ...opp, score, reasons, scoredTs: Date.now() };
  scoredOpps.push(scored);
  if (scoredOpps.length > MAX_SCORED) scoredOpps.shift();
  return scored;
}

export function getTopOpportunities(limit = 20) {
  return [...scoredOpps]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
