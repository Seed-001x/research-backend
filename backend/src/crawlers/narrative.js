// src/crawlers/narrative.js — monitors X, TG channels, news for emerging narratives
// Tiered: cheap polling for social, LLM only for high-value synthesis.

const findings = [];
const MAX_FINDINGS = 200;

// Keywords that signal narrative heat
const NARRATIVE_KEYWORDS = [
  'ai agent', 'defai', 'rwa', 'depin', 'meme', 'l1', 'l2', 'restaking',
  'prediction market', 'ordinals', 'runes', 'solana', 'base', 'blast',
];

export function recordNarrativeFinding(f) {
  findings.push({ ...f, ts: Date.now(), id: Math.random().toString(36).slice(2) });
  if (findings.length > MAX_FINDINGS) findings.shift();
}

export function getNarrativeHeat() {
  // Aggregate keyword mentions in last 1h, 6h, 24h
  const now = Date.now();
  const windows = { '1h': 3600000, '6h': 21600000, '24h': 86400000 };
  const heat = {};
  for (const kw of NARRATIVE_KEYWORDS) {
    heat[kw] = {};
    for (const [label, ms] of Object.entries(windows)) {
      heat[kw][label] = findings.filter(
        f => f.text?.toLowerCase().includes(kw) && now - f.ts < ms
      ).length;
    }
  }
  return heat;
}

export function getRecentFindings(limit = 50) {
  return findings.slice(-limit).reverse();
}

export function getTrackedWallets() {
  return trackedWallets.map(w => ({ handle: w.handle, mint: w.mint, pnl: w.pnl }));
}

// Poll X/TG/news sources (implement per-source fetchers)
export async function crawlNarratives() {
  // v1: use free news APIs + DexScreener trending as narrative proxies
  // X API and TG require keys — wire up when user provides them
  try {
    // DexScreener trending as a narrative signal (free, no key)
    const r = await fetch('https://api.dexscreener.com/token-boosts/top/v1', {
      signal: AbortSignal.timeout(10000),
    });
    if (r.ok) {
      const boosts = await r.json();
      for (const b of (boosts || []).slice(0, 20)) {
        recordNarrativeFinding({
          source: 'dexscreener-boost',
          text: `${b.tokenAddress} boosted — ${b.description || ''}`,
          mint: b.tokenAddress,
        });
      }
    }
  } catch {}
}
