import express from 'express';
import cors from 'cors';
import { getNarrativeHeat, getRecentFindings, crawlNarratives } from './crawlers/narrative.js';
import { getWhaleMoves, getAccumulationSignals, getTrackedWallets, crawlWhales } from './crawlers/whale.js';
import { getLaunchAnalyses, crawlLaunches } from './crawlers/launches.js';
import { getAirdropOpps, crawlAirdrops } from './crawlers/airdrop.js';
import { getTopOpportunities } from './lib/scorer.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

app.get('/api/narratives', (req, res) => {
  res.json({ heat: getNarrativeHeat(), findings: getRecentFindings(50) });
});

app.get('/api/whales', (req, res) => {
  res.json({
    moves: getWhaleMoves(50),
    accumulation: getAccumulationSignals(),
    tracked: getTrackedWallets(),
  });
});

app.get('/api/launches', (req, res) => {
  res.json({ analyses: getLaunchAnalyses(50) });
});

app.get('/api/airdrops', (req, res) => {
  res.json({ opportunities: getAirdropOpps(50) });
});

app.get('/api/opportunities', (req, res) => {
  res.json({ top: getTopOpportunities(20) });
});

// Crawl loops — tiered intervals
setInterval(() => crawlNarratives().catch(() => {}), 5 * 60000);   // 5 min
setInterval(() => crawlWhales().catch(() => {}), 10 * 60000);      // 10 min
setInterval(() => crawlLaunches().catch(() => {}), 15 * 60000);    // 15 min
setInterval(() => crawlAirdrops().catch(() => {}), 30 * 60000);    // 30 min

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`[research] listening on :${PORT}`);
  // Initial crawls
  crawlNarratives().catch(() => {});
  crawlWhales().catch(() => {});
});
