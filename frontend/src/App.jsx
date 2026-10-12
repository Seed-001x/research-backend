import { useState, useEffect } from 'react';
import './style.css';

const API = 'https://research-backend-lato.onrender.com';

function usePoll(endpoint, interval = 10000) {
  const [data, setData] = useState(null);
  useEffect(() => {
    let alive = true;
    const fetch_ = async () => {
      try {
        const r = await fetch(API + endpoint);
        const j = await r.json();
        if (alive) setData(j);
      } catch {}
    };
    fetch_();
    const t = setInterval(fetch_, interval);
    return () => { alive = false; clearInterval(t); };
  }, [endpoint]);
  return data;
}

function Panel({ title, children, live }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>{title}</h2>
        <span className={live ? 'live' : 'idle'}>{live ? '● live' : '○ idle'}</span>
      </div>
      {children}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('opportunities');
  const opps = usePoll('/api/opportunities');
  const narratives = usePoll('/api/narratives');
  const whales = usePoll('/api/whales');
  const launches = usePoll('/api/launches');
  const airdrops = usePoll('/api/airdrops');

  return (
    <div className="app">
      <header>
        <h1>◈ RESEARCH</h1>
        <p className="sub">deep crawlers · live intelligence · feeds the bot</p>
      </header>
      <nav className="tabs">
        {['opportunities', 'narratives', 'whales', 'launches', 'airdrops'].map(t => (
          <button key={t} className={tab === t ? 'active' : ''} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </nav>
      <main>
        {tab === 'opportunities' && (
          <Panel title="Top Opportunities" live={!!opps}>
            {!opps?.top?.length && <div className="empty">crawlers warming up — opportunities will appear here as they're scored</div>}
            {opps?.top?.map(o => (
              <div key={o.id || o.mint} className="opp">
                <div className="opp-top">
                  <span className="opp-sym">{o.symbol || '???'}</span>
                  <span className="opp-score">{o.score}/100</span>
                </div>
                {o.reasons?.map((r, i) => <div key={i} className="opp-reason">→ {r}</div>)}
              </div>
            ))}
          </Panel>
        )}
        {tab === 'narratives' && (
          <Panel title="Narrative Heat" live={!!narratives}>
            <div className="heat-grid">
              {narratives?.heat && Object.entries(narratives.heat).map(([kw, w]) => (
                <div key={kw} className="heat-cell">
                  <span className="heat-kw">{kw}</span>
                  <span className="heat-vals">1h:{w['1h']} 6h:{w['6h']} 24h:{w['24h']}</span>
                </div>
              ))}
            </div>
          </Panel>
        )}
        {tab === 'whales' && (
          <Panel title="Whale Accumulation" live={!!whales}>
            {!whales?.accumulation?.length && <div className="empty">no accumulation signals yet</div>}
            {whales?.accumulation?.map(a => (
              <div key={a.mint} className="whale-sig">
                <span className="opp-sym">{a.symbol}</span>
                <span className={`sig ${a.signal}`}>{a.signal}</span>
                <span>{a.walletCount} wallets · ${a.totalUsd}</span>
              </div>
            ))}
          </Panel>
        )}
        {tab === 'launches' && (
          <Panel title="Deep Launch Analysis" live={!!launches}>
            {!launches?.analyses?.length && <div className="empty">no deep dives queued yet</div>}
            {launches?.analyses?.map(a => (
              <div key={a.id} className="opp">
                <span className="opp-sym">{a.mint?.slice(0, 8)}…</span>
                <span>{a.status}</span>
              </div>
            ))}
          </Panel>
        )}
        {tab === 'airdrops' && (
          <Panel title="Airdrop Farming" live={!!airdrops}>
            {!airdrops?.opportunities?.length && <div className="empty">scanning for TGEs and farming opportunities…</div>}
            {airdrops?.opportunities?.map(o => (
              <div key={o.id} className="opp">
                <span className="opp-sym">{o.project || '???'}</span>
                <span>{o.type}</span>
                <div className="opp-reason">{o.details}</div>
              </div>
            ))}
          </Panel>
        )}
      </main>
    </div>
  );
}
