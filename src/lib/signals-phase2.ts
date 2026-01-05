import { Signal, ConfidenceLevel, Region } from '@/types';
import { clamp } from './utils';
import { logSignalError } from './logger';

// Helper to determine status from score
function scoreToStatus(score: number) {
  if (score < 35) return 'normal';
  if (score < 65) return 'elevated';
  return 'high';
}

// ============================================
// PHASE 2: Polymarket Prediction Markets
// ============================================
interface PolymarketMarket {
  id: string;
  question: string;
  outcomePrices: string;
  volume: number;
  liquidity: number;
  closed: boolean;
}

const CRISIS_KEYWORDS = [
  'war', 'invasion', 'invade', 'attack', 'military', 'nuclear',
  'russia', 'ukraine', 'china', 'taiwan', 'iran', 'israel', 'gaza',
  'ceasefire', 'conflict', 'troops', 'missile', 'nato', 'hamas',
  'sanctions', 'embargo', 'crisis', 'emergency', 'martial law'
];

/**
 * Polymarket Geopolitical Signal
 * Aggregates crisis probabilities from prediction markets
 * Free API, no auth required
 */
export async function fetchPolymarketSignal(): Promise<Signal | null> {
  try {
    const response = await fetch(
      'https://gamma-api.polymarket.com/markets?closed=false&limit=200',
      {
        next: { revalidate: 300 }, // 5 min cache
        headers: { 'Accept': 'application/json' }
      }
    );

    if (!response.ok) {
      throw new Error(`Polymarket API error: ${response.status}`);
    }

    const markets: PolymarketMarket[] = await response.json();

    // Filter for geopolitical/crisis markets
    const crisisMarkets = markets.filter(m => {
      const q = m.question.toLowerCase();
      return CRISIS_KEYWORDS.some(k => q.includes(k));
    });

    if (crisisMarkets.length === 0) {
      return {
        id: 'polymarket-crisis',
        name: 'Polymarket Crisis Odds',
        region: 'global' as Region,
        status: 'normal',
        score: 25,
        explanation: 'No active crisis-related prediction markets found.',
        baselineComparison: 'Monitoring active',
        confidence: 'low' as ConfidenceLevel,
        sourceUrl: 'https://polymarket.com',
        sourceName: 'Polymarket',
        lastUpdated: new Date(),
      };
    }

    // Calculate weighted average crisis probability
    let totalWeight = 0;
    let weightedProbSum = 0;
    const highProbMarkets: string[] = [];

    for (const market of crisisMarkets) {
      try {
        const prices = JSON.parse(market.outcomePrices || '[]');
        const yesProb = parseFloat(prices[0]) || 0;
        const volume = market.volume || 0;

        // Weight by volume (more traded = more reliable)
        const weight = Math.log10(Math.max(volume, 100));
        totalWeight += weight;
        weightedProbSum += yesProb * weight;

        // Track high probability events (>40%)
        if (yesProb > 0.4) {
          highProbMarkets.push(`${market.question.slice(0, 50)}... (${(yesProb * 100).toFixed(0)}%)`);
        }
      } catch {
        continue;
      }
    }

    const avgCrisisProb = totalWeight > 0 ? weightedProbSum / totalWeight : 0;

    // Score: higher average crisis probability = higher score
    // 20% avg = 40 score, 50% avg = 70 score
    const score = clamp(25 + avgCrisisProb * 90, 0, 100);

    return {
      id: 'polymarket-crisis',
      name: 'Polymarket Crisis Odds',
      region: 'global' as Region,
      status: scoreToStatus(score),
      score: Math.round(score),
      explanation: `${crisisMarkets.length} crisis markets tracked. Avg probability: ${(avgCrisisProb * 100).toFixed(1)}%. ${
        highProbMarkets.length > 0
          ? `High probability: ${highProbMarkets.slice(0, 2).join('; ')}`
          : 'No high-probability events.'
      }`,
      baselineComparison: `${crisisMarkets.length} active markets, $${(crisisMarkets.reduce((s, m) => s + (m.volume || 0), 0) / 1000000).toFixed(1)}M volume`,
      confidence: crisisMarkets.length >= 3 ? 'high' : 'medium' as ConfidenceLevel,
      sourceUrl: 'https://polymarket.com',
      sourceName: 'Polymarket',
      lastUpdated: new Date(),
    };
  } catch (error) {
    logSignalError({
      signalId: 'polymarket-crisis',
      sourceName: 'Polymarket',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
      errorType: 'network',
    });

    return {
      id: 'polymarket-crisis',
      name: 'Polymarket Crisis Odds',
      region: 'global' as Region,
      status: 'normal',
      score: 30,
      explanation: 'Prediction market data temporarily unavailable.',
      baselineComparison: 'Fallback: API unavailable',
      confidence: 'low' as ConfidenceLevel,
      sourceUrl: 'https://polymarket.com',
      sourceName: 'Polymarket (Fallback)',
      lastUpdated: new Date(),
    };
  }
}

// ============================================
// PHASE 2: Kalshi Political Risk Markets
// ============================================
interface KalshiMarket {
  ticker: string;
  title: string;
  yes_bid: number;
  yes_ask: number;
  volume: number;
  category: string;
  status: string;
}

interface KalshiResponse {
  cursor?: string;
  markets: KalshiMarket[];
}

const KALSHI_CATEGORIES = ['Politics', 'World', 'Economics'];
const KALSHI_KEYWORDS = [
  'president', 'congress', 'senate', 'election', 'impeach', 'resign',
  'fed', 'inflation', 'recession', 'unemployment', 'gdp', 'rate',
  'war', 'sanctions', 'tariff', 'shutdown', 'default', 'debt ceiling'
];

/**
 * Kalshi Political Risk Signal
 * Tracks political and economic prediction markets
 * Free public API for market data
 */
export async function fetchKalshiSignal(): Promise<Signal | null> {
  try {
    const response = await fetch(
      'https://api.elections.kalshi.com/trade-api/v2/markets?status=open&limit=100',
      {
        next: { revalidate: 300 },
        headers: { 'Accept': 'application/json' }
      }
    );

    if (!response.ok) {
      throw new Error(`Kalshi API error: ${response.status}`);
    }

    const data: KalshiResponse = await response.json();
    const markets = data.markets || [];

    // Filter for political/economic markets
    const relevantMarkets = markets.filter(m => {
      const title = m.title?.toLowerCase() || '';
      const category = m.category || '';
      return KALSHI_CATEGORIES.includes(category) ||
             KALSHI_KEYWORDS.some(k => title.includes(k));
    });

    if (relevantMarkets.length === 0) {
      return {
        id: 'kalshi-political-risk',
        name: 'Kalshi Political Risk',
        region: 'north-america' as Region,
        status: 'normal',
        score: 25,
        explanation: 'No active political risk markets found on Kalshi.',
        baselineComparison: 'Monitoring active',
        confidence: 'low' as ConfidenceLevel,
        sourceUrl: 'https://kalshi.com',
        sourceName: 'Kalshi',
        lastUpdated: new Date(),
      };
    }

    // Calculate average implied probability for high-impact events
    let volatileCount = 0;
    let highStakesCount = 0;
    const keyEvents: string[] = [];

    for (const market of relevantMarkets) {
      // yes_bid is in cents (0-99), represents probability
      const yesProb = (market.yes_bid || 0) / 100;
      const volume = market.volume || 0;

      // Volatile = probability between 30-70% (uncertain outcome)
      if (yesProb > 0.3 && yesProb < 0.7) {
        volatileCount++;
      }

      // High stakes = high volume
      if (volume > 10000) {
        highStakesCount++;
        keyEvents.push(`${market.title.slice(0, 40)}... (${(yesProb * 100).toFixed(0)}%)`);
      }
    }

    // Score based on volatility and stakes
    // More volatile markets = more uncertainty = higher risk score
    const volatilityRatio = volatileCount / Math.max(relevantMarkets.length, 1);
    const score = clamp(30 + volatilityRatio * 40 + highStakesCount * 3, 0, 100);

    return {
      id: 'kalshi-political-risk',
      name: 'Kalshi Political Risk',
      region: 'north-america' as Region,
      status: scoreToStatus(score),
      score: Math.round(score),
      explanation: `${relevantMarkets.length} political/economic markets. ${volatileCount} volatile (30-70% odds). ${
        keyEvents.length > 0
          ? `Key: ${keyEvents.slice(0, 2).join('; ')}`
          : 'Markets stable.'
      }`,
      baselineComparison: `${highStakesCount} high-volume events, ${volatileCount} uncertain outcomes`,
      confidence: relevantMarkets.length >= 5 ? 'high' : 'medium' as ConfidenceLevel,
      sourceUrl: 'https://kalshi.com',
      sourceName: 'Kalshi',
      lastUpdated: new Date(),
    };
  } catch (error) {
    logSignalError({
      signalId: 'kalshi-political-risk',
      sourceName: 'Kalshi',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
      errorType: 'network',
    });

    return {
      id: 'kalshi-political-risk',
      name: 'Kalshi Political Risk',
      region: 'north-america' as Region,
      status: 'normal',
      score: 25,
      explanation: 'Political risk monitoring active (API fallback).',
      baselineComparison: 'Fallback: API unavailable',
      confidence: 'low' as ConfidenceLevel,
      sourceUrl: 'https://kalshi.com',
      sourceName: 'Kalshi (Fallback)',
      lastUpdated: new Date(),
    };
  }
}

// ============================================
// PHASE 2: Pentagon Pizza Index
// ============================================
interface PizzIntData {
  alertLevel: string;
  locations: number;
  spikeDetected: boolean;
  lastUpdate: string;
}

/**
 * Pentagon Pizza Index Signal
 * Classic OSINT indicator - late-night activity at Pentagon area
 * Uses pizzint.watch data or Google Maps foot traffic as fallback
 */
export async function fetchPentagonPizzaSignal(): Promise<Signal | null> {
  try {
    // Try pizzint.watch API first
    const response = await fetch(
      'https://www.pizzint.watch/api/status',
      {
        next: { revalidate: 600 }, // 10 min cache
        headers: { 'Accept': 'application/json' }
      }
    );

    if (response.ok) {
      const data = await response.json();

      // Interpret alert levels
      let score = 25;
      let status: 'normal' | 'elevated' | 'high' = 'normal';

      const alertLevel = (data.alertLevel || data.level || '').toLowerCase();

      if (alertLevel.includes('critical') || alertLevel.includes('high') || alertLevel.includes('defcon 1')) {
        score = 85;
        status = 'high';
      } else if (alertLevel.includes('elevated') || alertLevel.includes('warning') || alertLevel.includes('defcon 2')) {
        score = 60;
        status = 'elevated';
      } else if (alertLevel.includes('guarded') || alertLevel.includes('defcon 3')) {
        score = 45;
        status = 'elevated';
      }

      return {
        id: 'pentagon-pizza',
        name: 'Pentagon Pizza Index',
        region: 'north-america' as Region,
        status,
        score,
        explanation: `Alert level: ${alertLevel || 'Normal'}. ${
          data.spikeDetected
            ? 'Late-night activity spike detected near Pentagon.'
            : 'Normal activity patterns.'
        }`,
        baselineComparison: `Monitoring ${data.locations || 8} pizza locations`,
        confidence: 'medium' as ConfidenceLevel,
        sourceUrl: 'https://pizzint.watch',
        sourceName: 'PizzINT',
        lastUpdated: new Date(),
      };
    }

    // Fallback: Check current time - late night in DC (10pm-4am ET) = slightly elevated baseline
    const now = new Date();
    const dcHour = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' })).getHours();
    const isLateNight = dcHour >= 22 || dcHour < 4;

    return {
      id: 'pentagon-pizza',
      name: 'Pentagon Pizza Index',
      region: 'north-america' as Region,
      status: isLateNight ? 'elevated' : 'normal',
      score: isLateNight ? 40 : 22,
      explanation: isLateNight
        ? 'Late-night hours in DC (monitoring active). No spike data available.'
        : 'Normal business hours. Pentagon area activity baseline.',
      baselineComparison: `DC time: ${dcHour}:00 ET`,
      confidence: 'low' as ConfidenceLevel,
      sourceUrl: 'https://pizzint.watch',
      sourceName: 'Pentagon Pizza (Fallback)',
      lastUpdated: new Date(),
    };
  } catch (error) {
    logSignalError({
      signalId: 'pentagon-pizza',
      sourceName: 'PizzINT',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
      errorType: 'network',
    });

    // Time-based fallback
    const now = new Date();
    const dcHour = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' })).getHours();
    const isLateNight = dcHour >= 22 || dcHour < 4;

    return {
      id: 'pentagon-pizza',
      name: 'Pentagon Pizza Index',
      region: 'north-america' as Region,
      status: 'normal',
      score: isLateNight ? 35 : 20,
      explanation: 'Classic OSINT indicator monitoring Pentagon area activity.',
      baselineComparison: 'Fallback: Direct API unavailable',
      confidence: 'low' as ConfidenceLevel,
      sourceUrl: 'https://pizzint.watch',
      sourceName: 'Pentagon Pizza (Fallback)',
      lastUpdated: new Date(),
    };
  }
}

// ============================================
// Export all Phase 2 signals
// ============================================
export const phase2Signals = [
  fetchPolymarketSignal,
  fetchKalshiSignal,
  fetchPentagonPizzaSignal,
] as const;
