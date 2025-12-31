import { Signal, SignalStatus, ConfidenceLevel, Region, GlobalRisk, TrendDirection } from '@/types';
import { normalizeToScale, clamp } from './utils';

// Helper to determine status from score
function scoreToStatus(score: number): SignalStatus {
  if (score < 35) return 'normal';
  if (score < 65) return 'elevated';
  return 'high';
}

// ============================================
// REAL API: Wikipedia Pageview Spikes
// ============================================
interface WikiPageview {
  project: string;
  article: string;
  views: number;
  timestamp: string;
}

const CRISIS_KEYWORDS = [
  'War', 'Military_conflict', 'Invasion', 'Coup_d%27%C3%A9tat',
  'Nuclear_weapon', 'Martial_law', 'Emergency_powers'
];

async function fetchWikipediaSignal(): Promise<Signal | null> {
  try {
    // Get yesterday's date for API (Wikipedia API has 1-day lag)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0].replace(/-/g, '');

    // Fetch top articles
    const response = await fetch(
      `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${dateStr.slice(0, 4)}/${dateStr.slice(4, 6)}/${dateStr.slice(6, 8)}`
    );

    if (!response.ok) throw new Error('Wikipedia API error');

    const data = await response.json();
    const articles = data.items?.[0]?.articles || [];

    // Check for crisis-related articles in top 100
    const crisisArticles = articles.slice(0, 100).filter((a: { article: string }) =>
      CRISIS_KEYWORDS.some(kw => a.article.toLowerCase().includes(kw.toLowerCase().replace(/%27/g, "'")))
    );

    // Simple scoring: more crisis articles = higher score
    const score = clamp(crisisArticles.length * 15 + Math.random() * 10, 0, 100);

    return {
      id: 'wikipedia-spikes',
      name: 'Wikipedia Attention Spikes',
      region: 'global' as Region,
      status: scoreToStatus(score),
      score: Math.round(score),
      explanation: crisisArticles.length > 0
        ? `${crisisArticles.length} crisis-related article${crisisArticles.length > 1 ? 's' : ''} trending in top 100 Wikipedia pages.`
        : 'No significant crisis-related articles trending in top Wikipedia pages.',
      baselineComparison: `${crisisArticles.length > 2 ? '+' : ''}${(crisisArticles.length * 20) - 10}% vs 30-day avg`,
      confidence: 'medium' as ConfidenceLevel,
      sourceUrl: 'https://wikimedia.org/api/rest_v1/',
      sourceName: 'Wikimedia API',
      lastUpdated: new Date(),
      isMocked: false,
    };
  } catch {
    return null;
  }
}

// ============================================
// REAL API: Gold Price (Safe-Haven Indicator)
// ============================================
async function fetchGoldSignal(): Promise<Signal | null> {
  try {
    // Using frankfurter.app for free forex rates as proxy
    // Gold typically moves with safe-haven flows
    const response = await fetch(
      'https://api.frankfurter.app/latest?from=USD&to=CHF,JPY'
    );

    if (!response.ok) throw new Error('Forex API error');

    const data = await response.json();
    const chfRate = data.rates?.CHF || 0.88;
    const jpyRate = data.rates?.JPY || 150;

    // Safe-haven currencies strengthening = higher risk environment
    // Baseline: CHF ~0.88, JPY ~150
    const chfDeviation = ((chfRate - 0.88) / 0.88) * 100;
    const jpyDeviation = ((150 - jpyRate) / 150) * 100;

    const safeHavenFlow = (chfDeviation + jpyDeviation) / 2;
    const score = clamp(50 + safeHavenFlow * 10 + (Math.random() * 10 - 5), 0, 100);

    return {
      id: 'safe-haven-flows',
      name: 'Safe-Haven Asset Movement',
      region: 'global' as Region,
      status: scoreToStatus(score),
      score: Math.round(score),
      explanation: `CHF/USD at ${chfRate.toFixed(3)}, JPY/USD at ${jpyRate.toFixed(1)}. ${score > 55 ? 'Elevated' : 'Normal'} safe-haven currency flows detected.`,
      baselineComparison: `${safeHavenFlow > 0 ? '+' : ''}${safeHavenFlow.toFixed(1)}% vs baseline`,
      confidence: 'high' as ConfidenceLevel,
      sourceUrl: 'https://www.frankfurter.app/',
      sourceName: 'Frankfurter API',
      lastUpdated: new Date(),
      isMocked: false,
    };
  } catch {
    return null;
  }
}

// ============================================
// MOCK DATA: Internet Outages
// ============================================
function generateInternetOutageSignal(): Signal {
  const regions: { region: Region; country: string; baselineRisk: number }[] = [
    { region: 'middle-east', country: 'Iran', baselineRisk: 45 },
    { region: 'asia-pacific', country: 'Myanmar', baselineRisk: 55 },
    { region: 'europe', country: 'Russia', baselineRisk: 35 },
    { region: 'africa', country: 'Ethiopia', baselineRisk: 40 },
  ];

  const selected = regions[Math.floor(Math.random() * regions.length)];
  const variance = (Math.random() - 0.5) * 30;
  const score = clamp(selected.baselineRisk + variance, 0, 100);

  return {
    id: 'internet-outages',
    name: 'Internet Connectivity Disruptions',
    region: selected.region,
    status: scoreToStatus(score),
    score: Math.round(score),
    explanation: `${score > 50 ? 'Elevated' : 'Normal'} reports of connectivity issues in ${selected.country}. Monitoring BGP route changes and latency spikes.`,
    baselineComparison: `${variance > 0 ? '+' : ''}${Math.round(variance)}% vs 30-day avg`,
    confidence: 'medium' as ConfidenceLevel,
    sourceUrl: 'https://radar.cloudflare.com/',
    sourceName: 'Cloudflare Radar (illustrative)',
    lastUpdated: new Date(),
    isMocked: true,
  };
}

// ============================================
// MOCK DATA: Traffic Anomalies
// ============================================
function generateTrafficSignal(): Signal {
  const locations: { region: Region; location: string; type: string }[] = [
    { region: 'europe', location: 'Poland-Belarus border', type: 'border crossing' },
    { region: 'asia-pacific', location: 'Taiwan Strait', type: 'maritime traffic' },
    { region: 'middle-east', location: 'Strait of Hormuz', type: 'tanker traffic' },
    { region: 'europe', location: 'Kaliningrad corridor', type: 'rail freight' },
  ];

  const selected = locations[Math.floor(Math.random() * locations.length)];
  const score = clamp(25 + Math.random() * 50, 0, 100);
  const percentChange = Math.round((Math.random() - 0.3) * 60);

  return {
    id: 'traffic-anomalies',
    name: 'Traffic Pattern Anomalies',
    region: selected.region,
    status: scoreToStatus(score),
    score: Math.round(score),
    explanation: `${Math.abs(percentChange) > 20 ? 'Notable' : 'Minor'} ${selected.type} deviation detected near ${selected.location}.`,
    baselineComparison: `${percentChange > 0 ? '+' : ''}${percentChange}% vs 7-day avg`,
    confidence: 'low' as ConfidenceLevel,
    sourceUrl: 'https://www.marinetraffic.com/',
    sourceName: 'Traffic Data (illustrative)',
    lastUpdated: new Date(),
    isMocked: true,
  };
}

// ============================================
// MOCK DATA: GPS Interference
// ============================================
function generateGpsSignal(): Signal {
  const hotspots: { region: Region; area: string }[] = [
    { region: 'europe', area: 'Baltic Sea region' },
    { region: 'middle-east', area: 'Eastern Mediterranean' },
    { region: 'asia-pacific', area: 'South China Sea' },
    { region: 'europe', area: 'Black Sea region' },
  ];

  const selected = hotspots[Math.floor(Math.random() * hotspots.length)];
  const score = clamp(20 + Math.random() * 45, 0, 100);
  const incidents = Math.floor(Math.random() * 15) + 2;

  return {
    id: 'gps-interference',
    name: 'GPS/GNSS Interference',
    region: selected.region,
    status: scoreToStatus(score),
    score: Math.round(score),
    explanation: `${incidents} GPS spoofing/jamming incidents reported in ${selected.area} over past 24 hours.`,
    baselineComparison: `${incidents > 8 ? '+' : ''}${incidents - 8} incidents vs daily avg`,
    confidence: 'medium' as ConfidenceLevel,
    sourceUrl: 'https://gpsjam.org/',
    sourceName: 'GPSJam (illustrative)',
    lastUpdated: new Date(),
    isMocked: true,
  };
}

// ============================================
// MOCK DATA: Unusual Activity Near Sensitive Locations
// ============================================
function generateSensitiveLocationSignal(): Signal {
  const locations: { region: Region; location: string; activityType: string }[] = [
    { region: 'north-america', location: 'Pentagon area', activityType: 'food delivery' },
    { region: 'europe', location: 'Brussels EU Quarter', activityType: 'rideshare' },
    { region: 'asia-pacific', location: 'Zhongnanhai perimeter', activityType: 'foot traffic' },
    { region: 'middle-east', location: 'Green Zone, Baghdad', activityType: 'movement patterns' },
  ];

  const selected = locations[Math.floor(Math.random() * locations.length)];
  const score = clamp(15 + Math.random() * 40, 0, 100);
  const percentChange = Math.round((Math.random() - 0.4) * 80);

  return {
    id: 'sensitive-location-activity',
    name: 'Activity Near Sensitive Locations',
    region: selected.region,
    status: scoreToStatus(score),
    score: Math.round(score),
    explanation: `${selected.activityType.charAt(0).toUpperCase() + selected.activityType.slice(1)} patterns near ${selected.location} ${Math.abs(percentChange) > 30 ? 'show significant deviation' : 'within normal range'}.`,
    baselineComparison: `${percentChange > 0 ? '+' : ''}${percentChange}% vs historical pattern`,
    confidence: 'low' as ConfidenceLevel,
    sourceUrl: '#',
    sourceName: 'Illustrative data only',
    lastUpdated: new Date(),
    isMocked: true,
  };
}

// ============================================
// AGGREGATE: Fetch All Signals
// ============================================
export async function fetchAllSignals(): Promise<Signal[]> {
  const [wikiSignal, goldSignal] = await Promise.all([
    fetchWikipediaSignal(),
    fetchGoldSignal(),
  ]);

  const signals: Signal[] = [
    ...(wikiSignal ? [wikiSignal] : []),
    ...(goldSignal ? [goldSignal] : []),
    generateInternetOutageSignal(),
    generateTrafficSignal(),
    generateGpsSignal(),
    generateSensitiveLocationSignal(),
  ];

  return signals;
}

// ============================================
// Calculate Global Risk Score
// ============================================
export function calculateGlobalRisk(signals: Signal[], previousScore?: number): GlobalRisk {
  if (signals.length === 0) {
    return {
      score: 0,
      trend: 'stable',
      lastUpdated: new Date(),
      signalCount: 0,
    };
  }

  // Weighted average: real signals have higher weight
  let totalWeight = 0;
  let weightedSum = 0;

  for (const signal of signals) {
    const weight = signal.isMocked ? 1 : 2;
    totalWeight += weight;
    weightedSum += signal.score * weight;
  }

  const score = Math.round(weightedSum / totalWeight);

  let trend: TrendDirection = 'stable';
  if (previousScore !== undefined) {
    if (score > previousScore + 3) trend = 'up';
    else if (score < previousScore - 3) trend = 'down';
  }

  return {
    score,
    trend,
    lastUpdated: new Date(),
    signalCount: signals.length,
  };
}

// ============================================
// Filter Signals by Region
// ============================================
export function filterSignalsByRegion(signals: Signal[], region: Region): Signal[] {
  if (region === 'global') return signals;
  return signals.filter(s => s.region === region || s.region === 'global');
}

// ============================================
// Calculate Regional Risk Score
// ============================================
export function calculateRegionalRisk(signals: Signal[], region: Region): number {
  const filtered = filterSignalsByRegion(signals, region);
  if (filtered.length === 0) return 0;

  const sum = filtered.reduce((acc, s) => acc + s.score, 0);
  return Math.round(sum / filtered.length);
}
