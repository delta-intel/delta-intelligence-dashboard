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

**Live feeds:**
- **Wikipedia attention** — crisis articles trending in real-time pageviews
- **Safe-haven flows** — CHF/USD, JPY/USD movement as risk proxies

**Simulated (for now):**
- Internet connectivity disruptions (BGP routes, latency)
- Border/maritime traffic anomalies
- GPS/GNSS interference patterns
- Activity near sensitive locations

Have a data source you want to add? [Fork the repo](https://github.com/delta-intel/delta-intelligence-dashboard/fork), add your data source, and create a [pull request &rarr;](https://github.com/delta-intel/delta-intelligence-dashboard/pulls).

## scoring

Everything normalized to 0-100:

| Range | Status | Meaning |
|-------|--------|---------|
| 0-34 | Normal | baseline noise |
| 35-64 | Elevated | worth watching |
| 65-100 | High | something's happening |

Real API signals weighted 2x vs mock. Trend arrows show ±3pt movement.

## stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind
- 60s polling interval

Intentionally minimal. No auth, no persistence, no complexity. Just the feed.

## architecture

```
src/
├── app/           # pages
├── components/    # UI bits
├── lib/           # data fetching + hooks
└── types/         # TS definitions
```

## adding signals

1. Define type in `src/types/index.ts`
2. Write fetch function in `src/lib/signals.ts`
3. Add to `fetchAllSignals()` array

PRs welcome if you have access to interesting data sources.

## limitations

- Wikipedia API has ~24h lag
- No historical storage yet
- Mock signals are probabilistic

## disclaimer

Research tool. Public data. Not predictions. Not financial advice.

If you're using this for anything serious, you should probably also be looking at the primary sources.

---

*The best time to know something is before everyone else. The second best time is now.*
