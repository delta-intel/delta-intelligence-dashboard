# △ Delta Intelligence

![Delta Intelligence Dashboard](https://i.imgur.com/DEBHGaR.png)

Major events leave traces in public data before they hit headlines. Internet goes dark, pizza deliveries sky-rocket, Wikipedia spikes, safe-haven currencies move, traffic patterns shift. All observable. All public. All in real-time.

This aggregates the noise and finds the signal.

[View Live Demo &rarr;](https://deltaintel.vercel.app/)

## why

Information asymmetry is compressing to zero. The tools to see what's happening exist — they're just scattered across a dozen tabs. This puts them in one place.

The wikipedia → crisis correlation actually holds up surprisingly well.

## run it

```bash
npm install
npm run dev
```

[localhost:3000](http://localhost:3000)

## signals

**15 live data sources:**

| Signal | Source | What it tracks |
|--------|--------|----------------|
| Wikipedia attention | Wikimedia API | Crisis article pageviews in real-time |
| Safe-haven flows | Exchange rates | CHF/USD, JPY/USD as risk proxies |
| Earthquakes | USGS | M4.5+ seismic events globally |
| Natural disasters | NASA EONET | Wildfires, storms, volcanic activity |
| News tension | GDELT | Global news tone and event monitoring |
| Internet outages | Cloudflare Radar | Regional connectivity disruptions |
| Flight activity | OpenSky | Air traffic anomalies |
| VIX | Yahoo Finance | Market fear/volatility index |
| Treasury yields | Yahoo Finance / FRED | Yield curve, recession indicators |
| Oil prices | Yahoo Finance | WTI crude, supply disruption proxy |
| Gold prices | Yahoo Finance | Safe-haven demand |
| Dollar index | Yahoo Finance | DXY, global flight-to-safety |
| Polymarket | Polymarket API | Geopolitical crisis prediction odds |
| Kalshi | Kalshi API | Political/economic event markets |
| Pentagon Pizza | PizzINT | Late-night DC activity (classic OSINT) |

All signals have fallback handling — if an API goes down, the dashboard stays up.

Want to add a source? [Fork it](https://github.com/delta-intel/delta-intelligence-dashboard/fork) and [PR it](https://github.com/delta-intel/delta-intelligence-dashboard/pulls).

## scoring

Everything normalized to 0-100:

| Range | Status | Meaning |
|-------|--------|---------|
| 0-34 | Normal | baseline noise |
| 35-64 | Elevated | worth watching |
| 65-100 | High | something's happening |

Trend arrows show ±3pt movement over last update.

## stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind
- 60s polling interval

Intentionally minimal. No auth, no persistence, no complexity. Just the feed.

## architecture

```
src/
├── app/              # pages
├── components/       # UI bits
├── lib/
│   ├── signals.ts        # core signals + aggregator
│   ├── signals-phase1.ts # market signals (VIX, oil, gold, etc.)
│   ├── signals-phase2.ts # prediction markets + OSINT
│   └── ...
└── types/            # TS definitions
```

## adding signals

1. Define type in `src/types/index.ts`
2. Write fetch function in `src/lib/signals.ts`
3. Add to `fetchAllSignals()` array

PRs welcome if you have access to interesting data sources.

## limitations

- Some APIs rate-limit aggressively (OpenSky, etc.) — fallbacks kick in
- No historical storage yet
- Prediction markets can be illiquid on weekends

## disclaimer

Research tool. Public data. Not predictions. Not financial advice.

If you're using this for anything serious, you should probably also be looking at the primary sources.

---

*The best time to know something is before everyone else. The second best time is now.*
