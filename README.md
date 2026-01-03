# △ Delta Intelligence

**Delta Intelligence** — Real-time OSINT risk dashboard monitoring unconventional signals that may precede major geopolitical events.

```
      ▲        ██████╗ ███████╗██╗███╗   ██╗████████╗
     ╱█╲       ██╔══██╗██╔════╝██║████╗  ██║╚══██╔══╝
    ╱███╲      ██║  ██║███████╗██║██╔██╗ ██║   ██║
   ╱█████╲     ██║  ██║╚════██║██║██║╚██╗██║   ██║
  ╱███████╲    ██████╔╝███████║██║██║ ╚████║   ██║
 ▔▔▔▔▔▔▔▔▔▔   ╚═════╝ ╚══════╝╚═╝╚═╝  ╚═══╝   ╚═╝
```

## Overview

Delta Intelligence aggregates public data signals, compares them to historical baselines, and surfaces them as explainable risk indicators. Monitors the delta — the change from normal — across multiple signal types.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Signals

### Real Data Sources

| Signal | Source | Description |
|--------|--------|-------------|
| Wikipedia Attention Spikes | [Wikimedia API](https://wikimedia.org/api/rest_v1/) | Detects crisis-related articles trending in top Wikipedia pages |
| Safe-Haven Asset Movement | [Frankfurter API](https://www.frankfurter.app/) | Monitors CHF/USD and JPY/USD as safe-haven flow proxies |

### Mock/Illustrative Data

| Signal | Description | Based On |
|--------|-------------|----------|
| Internet Connectivity Disruptions | BGP route changes, latency spikes | [Cloudflare Radar](https://radar.cloudflare.com/) patterns |
| Traffic Pattern Anomalies | Border crossings, maritime traffic | [MarineTraffic](https://www.marinetraffic.com/) patterns |
| GPS/GNSS Interference | Spoofing/jamming incidents | [GPSJam](https://gpsjam.org/) patterns |
| Activity Near Sensitive Locations | Movement patterns near government hubs | Illustrative concept only |

## Scoring System

All signals are normalized to a 0-100 scale:

| Score Range | Status | Color |
|-------------|--------|-------|
| 0-34 | Normal | Green |
| 35-64 | Elevated | Amber |
| 65-100 | High | Red |

### Global Risk Calculation

The global risk score is a weighted average of all signals:
- **Real API signals**: Weight = 2
- **Mock signals**: Weight = 1

Trend indicators:
- ↑ Score increased by >3 points since last update
- ↓ Score decreased by >3 points since last update
- → Score stable (within ±3 points)

### Confidence Levels

- **High**: Real API data, well-established methodology
- **Medium**: Real API data with inference, or reliable mock patterns
- **Low**: Illustrative data, experimental methodology

## Architecture

```
src/
├── app/
│   ├── globals.css     # Terminal styling
│   ├── layout.tsx      # Root layout with metadata
│   └── page.tsx        # Main dashboard
├── components/
│   ├── Header.tsx      # △ logo, live indicator
│   ├── GlobalRiskOverview.tsx
│   ├── SignalCard.tsx
│   ├── SignalFeed.tsx
│   ├── RegionalFilter.tsx
│   ├── StatusBadge.tsx
│   └── ErrorState.tsx
├── lib/
│   ├── signals.ts      # Data fetching (real + mock)
│   ├── hooks.ts        # useDashboard hook with polling
│   └── utils.ts        # Helper functions
└── types/
    └── index.ts        # TypeScript definitions
```

## Features

- Dark mode with terminal aesthetic
- Real-time updates via 60-second polling
- Regional filtering with recalculated scores
- Mobile responsive
- Clear labeling of mock vs real data

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS

## Configuration

### Polling Interval

Edit `src/lib/hooks.ts`:
```typescript
const POLL_INTERVAL = 60000; // milliseconds
```

### Adding New Signals

1. Add signal type to `src/types/index.ts`
2. Create fetch function in `src/lib/signals.ts`
3. Add to `fetchAllSignals()` array

## Limitations

- Wikipedia API has ~24h data lag
- Mock signals use randomized realistic patterns
- No historical data storage
- No user authentication

## Disclaimer

Experimental research tool. Signals are derived from public data and may be inaccurate. Not financial advice.
