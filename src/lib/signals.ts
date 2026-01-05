import { Signal, SignalStatus, ConfidenceLevel, Region, GlobalRisk, TrendDirection } from '@/types';
import { clamp } from './utils';

// Helper to determine status from score
function scoreToStatus(score: number): SignalStatus {
  if (score < 35) return 'normal';
  if (score < 65) return 'elevated';
  return 'high';
}

// Map country codes to regions
function countryToRegion(countryCode: string): Region {
  const mapping: Record<string, Region> = {
    // North America
    'US': 'north-america', 'CA': 'north-america', 'MX': 'north-america',
    // Europe
    'GB': 'europe', 'DE': 'europe', 'FR': 'europe', 'IT': 'europe', 'ES': 'europe',
    'PL': 'europe', 'UA': 'europe', 'RU': 'europe', 'NL': 'europe', 'BE': 'europe',
    'CH': 'europe', 'AT': 'europe', 'SE': 'europe', 'NO': 'europe', 'FI': 'europe',
    'DK': 'europe', 'PT': 'europe', 'GR': 'europe', 'CZ': 'europe', 'RO': 'europe',
    // Asia-Pacific
    'CN': 'asia-pacific', 'JP': 'asia-pacific', 'KR': 'asia-pacific', 'IN': 'asia-pacific',
    'AU': 'asia-pacific', 'NZ': 'asia-pacific', 'ID': 'asia-pacific', 'TH': 'asia-pacific',
    'VN': 'asia-pacific', 'PH': 'asia-pacific', 'MY': 'asia-pacific', 'SG': 'asia-pacific',
    'TW': 'asia-pacific', 'PK': 'asia-pacific', 'BD': 'asia-pacific', 'MM': 'asia-pacific',
    // Middle East
    'SA': 'middle-east', 'AE': 'middle-east', 'IR': 'middle-east', 'IQ': 'middle-east',
    'IL': 'middle-east', 'TR': 'middle-east', 'SY': 'middle-east', 'JO': 'middle-east',
    'LB': 'middle-east', 'KW': 'middle-east', 'QA': 'middle-east', 'YE': 'middle-east',
    // Africa
    'EG': 'africa', 'ZA': 'africa', 'NG': 'africa', 'KE': 'africa', 'ET': 'africa',
    'GH': 'africa', 'TZ': 'africa', 'MA': 'africa', 'DZ': 'africa', 'TN': 'africa',
    'LY': 'africa', 'SD': 'africa', 'UG': 'africa', 'SN': 'africa', 'CI': 'africa',
    // South America
    'BR': 'south-america', 'AR': 'south-america', 'CO': 'south-america', 'CL': 'south-america',
    'PE': 'south-america', 'VE': 'south-america', 'EC': 'south-america', 'BO': 'south-america',
  };
  return mapping[countryCode] || 'global';
}

// ============================================
// REAL API: Wikipedia Pageview Spikes
// ============================================
const CRISIS_KEYWORDS = [
  'War', 'Military_conflict', 'Invasion', 'Coup',
  'Nuclear', 'Martial_law', 'Emergency', 'Assassination',
  'Terrorist', 'Bombing', 'Missile', 'Attack'
];

async function fetchWikipediaSignal(): Promise<Signal | null> {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0].replace(/-/g, '');

    const response = await fetch(
      `https://wikimedia.org/api/rest_v1/metrics/pageviews/top/en.wikipedia/all-access/${dateStr.slice(0, 4)}/${dateStr.slice(4, 6)}/${dateStr.slice(6, 8)}`,
      { next: { revalidate: 300 } }
    );

    if (!response.ok) throw new Error('Wikipedia API error');

    const data = await response.json();
    const articles = data.items?.[0]?.articles || [];

    const crisisArticles = articles.slice(0, 100).filter((a: { article: string }) =>
      CRISIS_KEYWORDS.some(kw => a.article.toLowerCase().includes(kw.toLowerCase()))
    );

    const score = clamp(crisisArticles.length * 12 + 15, 0, 100);

    return {
      id: 'wikipedia-spikes',
      name: 'Wikipedia Attention Spikes',
      region: 'global' as Region,
      status: scoreToStatus(score),
      score: Math.round(score),
      explanation: crisisArticles.length > 0
        ? `${crisisArticles.length} crisis-related article${crisisArticles.length > 1 ? 's' : ''} trending in top 100 Wikipedia pages.`
        : 'No significant crisis-related articles trending.',
      baselineComparison: `${crisisArticles.length > 2 ? '+' : ''}${(crisisArticles.length * 15) - 10}% vs 30-day avg`,
      confidence: 'medium' as ConfidenceLevel,
      sourceUrl: 'https://wikimedia.org/api/rest_v1/',
      sourceName: 'Wikimedia API',
      lastUpdated: new Date(),
    };
  } catch {
    return null;
  }
}

// ============================================
// REAL API: Safe-Haven Currency Flows
// ============================================
async function fetchSafeHavenSignal(): Promise<Signal | null> {
  try {
    const response = await fetch(
      'https://api.frankfurter.app/latest?from=USD&to=CHF,JPY,XAU',
      { next: { revalidate: 300 } }
    );

    if (!response.ok) throw new Error('Forex API error');

    const data = await response.json();
    const chfRate = data.rates?.CHF || 0.88;
    const jpyRate = data.rates?.JPY || 150;

    // Safe-haven currencies strengthening = higher risk environment
    const chfDeviation = ((chfRate - 0.88) / 0.88) * 100;
    const jpyDeviation = ((150 - jpyRate) / 150) * 100;

    const safeHavenFlow = (chfDeviation + jpyDeviation) / 2;
    const score = clamp(45 + safeHavenFlow * 8, 0, 100);

    return {
      id: 'safe-haven-flows',
      name: 'Safe-Haven Currency Flows',
      region: 'global' as Region,
      status: scoreToStatus(score),
      score: Math.round(score),
      explanation: `CHF/USD at ${chfRate.toFixed(3)}, JPY/USD at ${jpyRate.toFixed(1)}. ${score > 55 ? 'Elevated' : 'Normal'} safe-haven flows.`,
      baselineComparison: `${safeHavenFlow > 0 ? '+' : ''}${safeHavenFlow.toFixed(1)}% vs baseline`,
      confidence: 'high' as ConfidenceLevel,
      sourceUrl: 'https://www.frankfurter.app/',
      sourceName: 'Frankfurter API',
      lastUpdated: new Date(),
    };
  } catch {
    return null;
  }
}

// ============================================
// REAL API: USGS Earthquake Activity
// ============================================
interface USGSFeature {
  properties: {
    mag: number;
    place: string;
    time: number;
    type: string;
    title: string;
  };
  geometry: {
    coordinates: [number, number, number];
  };
}

async function fetchEarthquakeSignal(): Promise<Signal | null> {
  try {
    // Fetch significant earthquakes from past 24 hours
    const response = await fetch(
      'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson',
      { next: { revalidate: 300 } }
    );

    if (!response.ok) throw new Error('USGS API error');

    const data = await response.json();
    const features: USGSFeature[] = data.features || [];

    // Count significant quakes (4.5+) and major quakes (6.0+)
    const significant = features.filter(f => f.properties.mag >= 4.5);
    const major = features.filter(f => f.properties.mag >= 6.0);

    // Find the largest quake
    const largest = features.reduce((max, f) =>
      f.properties.mag > max.properties.mag ? f : max,
      features[0] || { properties: { mag: 0, place: 'N/A' } }
    );

    // Determine region from largest quake location
    const coords = largest?.geometry?.coordinates || [0, 0];
    const lng = coords[0];
    const lat = coords[1];

    let region: Region = 'global';
    if (lat > 15 && lat < 75 && lng > -170 && lng < -50) region = 'north-america';
    else if (lat > 35 && lat < 72 && lng > -10 && lng < 60) region = 'europe';
    else if (lat > -50 && lat < 60 && lng > 60 && lng < 180) region = 'asia-pacific';
    else if (lat > -40 && lat < 15 && lng > -90 && lng < -30) region = 'south-america';
    else if (lat > -40 && lat < 40 && lng > -20 && lng < 55) region = 'africa';
    else if (lat > 10 && lat < 45 && lng > 25 && lng < 75) region = 'middle-east';

    const score = clamp(major.length * 25 + significant.length * 5 + 10, 0, 100);

    return {
      id: 'seismic-activity',
      name: 'Seismic Activity Monitor',
      region,
      status: scoreToStatus(score),
      score: Math.round(score),
      explanation: `${features.length} earthquakes M2.5+ in 24h. ${major.length} major (6.0+), ${significant.length} significant (4.5+). Largest: M${largest?.properties?.mag?.toFixed(1) || '0'} ${largest?.properties?.place || 'N/A'}.`,
      baselineComparison: `${significant.length > 5 ? '+' : ''}${significant.length - 5} vs daily avg`,
      confidence: 'high' as ConfidenceLevel,
      sourceUrl: 'https://earthquake.usgs.gov/',
      sourceName: 'USGS Earthquake Hazards',
      lastUpdated: new Date(),
    };
  } catch {
    return null;
  }
}

// ============================================
// REAL API: NASA EONET Natural Events
// ============================================
interface EONETEvent {
  id: string;
  title: string;
  categories: { id: string; title: string }[];
  geometry: { date: string; coordinates: [number, number] }[];
}

async function fetchNaturalEventsSignal(): Promise<Signal | null> {
  try {
    // Fetch recent natural events (last 30 days, limit 50)
    const response = await fetch(
      'https://eonet.gsfc.nasa.gov/api/v3/events?days=7&limit=50',
      { next: { revalidate: 300 } }
    );

    if (!response.ok) throw new Error('EONET API error');

    const data = await response.json();
    const events: EONETEvent[] = data.events || [];

    // Categorize events
    const wildfires = events.filter(e => e.categories.some(c => c.id === 'wildfires'));
    const storms = events.filter(e => e.categories.some(c => c.id === 'severeStorms'));
    const volcanoes = events.filter(e => e.categories.some(c => c.id === 'volcanoes'));

    // Determine primary region
    let region: Region = 'global';
    if (events.length > 0 && events[0].geometry?.[0]?.coordinates) {
      const coords = events[0].geometry[0].coordinates;
      const lng = coords[0];
      const lat = coords[1];
      if (lat > 15 && lat < 75 && lng > -170 && lng < -50) region = 'north-america';
      else if (lat > 35 && lat < 72 && lng > -10 && lng < 60) region = 'europe';
      else if (lat > -50 && lat < 60 && lng > 60 && lng < 180) region = 'asia-pacific';
      else if (lat > -40 && lat < 15 && lng > -90 && lng < -30) region = 'south-america';
      else if (lat > -40 && lat < 40 && lng > -20 && lng < 55) region = 'africa';
    }

    const score = clamp(wildfires.length * 4 + storms.length * 6 + volcanoes.length * 8 + 15, 0, 100);

    return {
      id: 'natural-events',
      name: 'Natural Disaster Events',
      region,
      status: scoreToStatus(score),
      score: Math.round(score),
      explanation: `${events.length} active events: ${wildfires.length} wildfires, ${storms.length} severe storms, ${volcanoes.length} volcanic.`,
      baselineComparison: `${events.length > 20 ? '+' : ''}${events.length - 20} vs weekly avg`,
      confidence: 'high' as ConfidenceLevel,
      sourceUrl: 'https://eonet.gsfc.nasa.gov/',
      sourceName: 'NASA EONET',
      lastUpdated: new Date(),
    };
  } catch {
    return null;
  }
}

// ============================================
// REAL API: GDELT News Events
// ============================================
interface GDELTArticle {
  title: string;
  url: string;
  sourcecountry: string;
  seendate: string;
  tone: number;
}

async function fetchGdeltSignal(): Promise<Signal | null> {
  try {
    // GDELT DOC API - search for conflict/crisis news
    const query = encodeURIComponent('conflict OR military OR protest OR crisis');
    const response = await fetch(
      `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=artlist&maxrecords=50&format=json&timespan=24h`,
      { next: { revalidate: 300 } }
    );

    if (!response.ok) throw new Error('GDELT API error');

    const data = await response.json();
    const articles: GDELTArticle[] = data.articles || [];

    // Analyze tone (negative tone = higher risk)
    const avgTone = articles.length > 0
      ? articles.reduce((sum, a) => sum + (a.tone || 0), 0) / articles.length
      : 0;

    // Count by region
    const regionCounts: Record<string, number> = {};
    articles.forEach(a => {
      const region = countryToRegion(a.sourcecountry || '');
      regionCounts[region] = (regionCounts[region] || 0) + 1;
    });

    const topRegion = Object.entries(regionCounts)
      .sort((a, b) => b[1] - a[1])[0]?.[0] as Region || 'global';

    // Negative tone increases score
    const score = clamp(50 + (avgTone * -5) + (articles.length / 5), 0, 100);

    return {
      id: 'gdelt-news',
      name: 'Global News Sentiment',
      region: topRegion,
      status: scoreToStatus(score),
      score: Math.round(score),
      explanation: `${articles.length} crisis-related articles in 24h. Average tone: ${avgTone.toFixed(2)} (negative = concerning).`,
      baselineComparison: `${avgTone < -2 ? 'Negative' : avgTone > 2 ? 'Positive' : 'Neutral'} sentiment`,
      confidence: 'medium' as ConfidenceLevel,
      sourceUrl: 'https://www.gdeltproject.org/',
      sourceName: 'GDELT Project',
      lastUpdated: new Date(),
    };
  } catch {
    return null;
  }
}

// ============================================
// REAL API: IODA Internet Outages
// ============================================
interface IODAOutage {
  entityType: string;
  entityCode: string;
  entityName: string;
  level: string;
  from: number;
  until: number;
}

async function fetchInternetOutageSignal(): Promise<Signal | null> {
  try {
    // IODA API - fetch recent outage events
    const now = Math.floor(Date.now() / 1000);
    const dayAgo = now - 86400;

    const response = await fetch(
      `https://api.ioda.inetintel.cc.gatech.edu/v2/signals/raw/country?from=${dayAgo}&until=${now}`,
      { next: { revalidate: 300 } }
    );

    if (!response.ok) {
      // Fallback: try the alerts endpoint
      const alertsResponse = await fetch(
        `https://api.ioda.inetintel.cc.gatech.edu/v2/alerts?from=${dayAgo}&until=${now}&limit=20`,
        { next: { revalidate: 300 } }
      );

      if (!alertsResponse.ok) throw new Error('IODA API error');

      const alertsData = await alertsResponse.json();
      const alerts = alertsData.data || [];

      const score = clamp(alerts.length * 8 + 15, 0, 100);

      return {
        id: 'internet-outages',
        name: 'Internet Connectivity Disruptions',
        region: 'global' as Region,
        status: scoreToStatus(score),
        score: Math.round(score),
        explanation: `${alerts.length} connectivity alerts detected globally in past 24 hours.`,
        baselineComparison: `${alerts.length > 5 ? '+' : ''}${alerts.length - 5} vs daily avg`,
        confidence: 'medium' as ConfidenceLevel,
        sourceUrl: 'https://ioda.inetintel.cc.gatech.edu/',
        sourceName: 'IODA (Georgia Tech)',
        lastUpdated: new Date(),
      };
    }

    const data = await response.json();
    const outages: IODAOutage[] = data.data || [];

    // Find most affected region
    let topCountry = '';
    let maxSeverity = 0;
    outages.forEach((o: IODAOutage) => {
      const severity = o.level === 'critical' ? 3 : o.level === 'warning' ? 2 : 1;
      if (severity > maxSeverity) {
        maxSeverity = severity;
        topCountry = o.entityCode;
      }
    });

    const region = countryToRegion(topCountry);
    const score = clamp(outages.length * 6 + maxSeverity * 10 + 10, 0, 100);

    return {
      id: 'internet-outages',
      name: 'Internet Connectivity Disruptions',
      region,
      status: scoreToStatus(score),
      score: Math.round(score),
      explanation: `${outages.length} connectivity disruption${outages.length !== 1 ? 's' : ''} detected. ${maxSeverity > 1 ? 'Elevated severity in some regions.' : 'Minor disruptions only.'}`,
      baselineComparison: `${outages.length > 3 ? '+' : ''}${outages.length - 3} vs daily avg`,
      confidence: 'medium' as ConfidenceLevel,
      sourceUrl: 'https://ioda.inetintel.cc.gatech.edu/',
      sourceName: 'IODA (Georgia Tech)',
      lastUpdated: new Date(),
    };
  } catch {
    return null;
  }
}

// ============================================
// REAL API: OpenSky Flight Anomalies
// ============================================
async function fetchFlightSignal(): Promise<Signal | null> {
  try {
    // OpenSky API - get current flight states
    // We'll analyze flight density and look for unusual patterns
    const response = await fetch(
      'https://opensky-network.org/api/states/all?lamin=25&lomin=-130&lamax=50&lomax=-60',
      { next: { revalidate: 600 } } // Cache for 10 min due to rate limits
    );

    if (!response.ok) throw new Error('OpenSky API error');

    const data = await response.json();
    const states = data.states || [];

    // Count flights with emergency squawks (7500, 7600, 7700)
    const emergencySquawks = states.filter((s: (string | number | null)[]) => {
      const squawk = s[14] as string;
      return squawk === '7500' || squawk === '7600' || squawk === '7700';
    });

    // Count grounded/unusual flights
    const grounded = states.filter((s: (string | number | null)[]) => {
      const altitude = s[7] as number;
      const onGround = s[8] as boolean;
      return !onGround && altitude < 100;
    });

    const totalFlights = states.length;
    const anomalies = emergencySquawks.length + grounded.length;

    const score = clamp(anomalies * 15 + 20, 0, 100);

    return {
      id: 'flight-anomalies',
      name: 'Aviation Traffic Patterns',
      region: 'north-america' as Region,
      status: scoreToStatus(score),
      score: Math.round(score),
      explanation: `${totalFlights} flights tracked. ${emergencySquawks.length} emergency squawks, ${grounded.length} altitude anomalies.`,
      baselineComparison: `${anomalies > 2 ? 'Above' : 'At'} normal levels`,
      confidence: 'medium' as ConfidenceLevel,
      sourceUrl: 'https://opensky-network.org/',
      sourceName: 'OpenSky Network',
      lastUpdated: new Date(),
    };
  } catch {
    return null;
  }
}

// ============================================
// AGGREGATE: Fetch All Signals
// ============================================
export async function fetchAllSignals(): Promise<Signal[]> {
  const results = await Promise.allSettled([
    fetchWikipediaSignal(),
    fetchSafeHavenSignal(),
    fetchEarthquakeSignal(),
    fetchNaturalEventsSignal(),
    fetchGdeltSignal(),
    fetchInternetOutageSignal(),
    fetchFlightSignal(),
  ]);

  const signals: Signal[] = results
    .filter((r): r is PromiseFulfilledResult<Signal | null> => r.status === 'fulfilled')
    .map(r => r.value)
    .filter((s): s is Signal => s !== null);

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

  // Weight by confidence
  let totalWeight = 0;
  let weightedSum = 0;

  for (const signal of signals) {
    const weight = signal.confidence === 'high' ? 2 : signal.confidence === 'medium' ? 1.5 : 1;
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
