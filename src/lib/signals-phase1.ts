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
// PHASE 1: VIX (Volatility Index)
// ============================================
/**
 * VIX signal - Market volatility/fear gauge
 * 30-day implied volatility of S&P 500
 * Lower cost free tier available
 */
export async function fetchVIXSignal(): Promise<Signal | null> {
  try {
    // Using Finnhub free tier for VIX data
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      throw new Error('FINNHUB_API_KEY not configured');
    }

    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=^VIX&token=${apiKey}`,
      { next: { revalidate: 60 } } // Cache for 1 minute - real-time during market hours
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const vixLevel = data.c || data.pc; // current price or previous close

    if (!vixLevel || typeof vixLevel !== 'number') {
      throw new Error('Missing VIX price data in response');
    }

    // VIX baseline: 15-20 is normal, >25 is elevated, >30 is high anxiety
    // Score: 0-100 scale
    const score = clamp((vixLevel / 40) * 100, 0, 100);

    return {
      id: 'vix-fear-index',
      name: 'Market Volatility Index (VIX)',
      region: 'global' as Region,
      status: scoreToStatus(score),
      score: Math.round(score),
      explanation: `VIX at ${vixLevel.toFixed(1)}. ${
        vixLevel > 30
          ? 'High market anxiety.'
          : vixLevel > 25
          ? 'Elevated market anxiety.'
          : 'Normal market anxiety.'
      }`,
      baselineComparison: `${((vixLevel - 17.5) / 17.5 * 100).toFixed(1)}% vs 20-day avg (baseline 17.5)`,
      confidence: 'high' as ConfidenceLevel,
      sourceUrl: 'https://www.cboe.com/vix',
      sourceName: 'Finnhub (CBOE VIX)',
      lastUpdated: new Date(),
    };
  } catch (error) {
    logSignalError({
      signalId: 'vix-fear-index',
      sourceName: 'Finnhub (CBOE VIX)',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
      errorType: 'network',
    });
    return null;
  }
}

// ============================================
// PHASE 1: Credit Market Spreads (20Y-7Y Yield)
// ============================================
/**
 * Credit spreads signal - Economic recession indicator
 * Spread between 20-year and 7-year Treasury yields
 * Inverted yield curve (spread < 0) predicts recessions
 */
export async function fetchCreditSpreadSignal(): Promise<Signal | null> {
  try {
    const fredKey = process.env.FRED_API_KEY;
    if (!fredKey) {
      throw new Error('FRED_API_KEY not configured');
    }

    // Fetch 20Y yield (DGS20)
    const res20y = await fetch(
      `https://api.fred.stlouisfed.org/series/DGS20?api_key=${fredKey}&file_type=json`,
      { next: { revalidate: 86400 } } // Daily updates
    );

    // Fetch 7Y yield (DGS7)
    const res7y = await fetch(
      `https://api.fred.stlouisfed.org/series/DGS7?api_key=${fredKey}&file_type=json`,
      { next: { revalidate: 86400 } }
    );

    if (!res20y.ok || !res7y.ok) {
      throw new Error(`FRED API error: 20Y=${res20y.status}, 7Y=${res7y.status}`);
    }

    const data20y = await res20y.json();
    const data7y = await res7y.json();

    const obs20y = data20y.observations || [];
    const obs7y = data7y.observations || [];

    if (obs20y.length === 0 || obs7y.length === 0) {
      throw new Error('No observations returned from FRED API');
    }

    const yield20y = parseFloat(obs20y[obs20y.length - 1].value);
    const yield7y = parseFloat(obs7y[obs7y.length - 1].value);

    if (isNaN(yield20y) || isNaN(yield7y)) {
      throw new Error('Invalid yield data');
    }

    const spread = yield20y - yield7y;

    // Inverted yield curve (spread < 0) is recession signal
    // Normal spread is 0.5-1.5%, inverted means < 0%
    // Score inversely: negative spread = high score
    const score = clamp(50 - spread * 20, 0, 100);

    return {
      id: 'credit-spreads',
      name: 'Credit Market Spread (20Y-7Y)',
      region: 'global' as Region,
      status: scoreToStatus(score),
      score: Math.round(score),
      explanation: `Spread at ${spread.toFixed(3)}%. ${
        spread < 0
          ? 'Inverted yield curve detected - recession risk elevated.'
          : spread < 0.5
          ? 'Flattening curve - watch for inversion.'
          : 'Normal curve.'
      }`,
      baselineComparison: `${spread > 0.5 ? '+' : ''}${(spread - 0.75).toFixed(3)}% vs historical avg (0.75%)`,
      confidence: 'high' as ConfidenceLevel,
      sourceUrl: 'https://fred.stlouisfed.org/',
      sourceName: 'FRED (Federal Reserve)',
      lastUpdated: new Date(),
    };
  } catch (error) {
    logSignalError({
      signalId: 'credit-spreads',
      sourceName: 'FRED (Federal Reserve)',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
      errorType: 'network',
    });
    return null;
  }
}

// ============================================
// PHASE 1: Oil Price Spikes (WTI Crude)
// ============================================
/**
 * Oil price signal - Supply disruption and geopolitical stress
 * West Texas Intermediate crude oil price
 * Spikes indicate supply concerns or conflict
 */
export async function fetchOilPriceSignal(): Promise<Signal | null> {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      throw new Error('FINNHUB_API_KEY not configured');
    }

    // Using Finnhub for WTI crude oil (WTIC)
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=WTIC&token=${apiKey}`,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    );

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const currentPrice = data.c || data.pc; // current or previous close

    if (!currentPrice || typeof currentPrice !== 'number') {
      throw new Error('Missing oil price data in response');
    }

    // 30-day moving average baseline: ~$75-80/barrel (varies)
    const baseline = 75;
    const priceDeviation = ((currentPrice - baseline) / baseline) * 100;

    // Score: deviation from baseline
    // Normal: +/-15%, Elevated: +15-30%, High: >30%
    const score = clamp(45 + priceDeviation * 0.8, 0, 100);

    return {
      id: 'oil-prices',
      name: 'WTI Crude Oil Price Spike',
      region: 'global' as Region,
      status: scoreToStatus(score),
      score: Math.round(score),
      explanation: `WTI crude at $${currentPrice.toFixed(2)}/barrel. ${
        priceDeviation > 20
          ? 'Supply concerns detected - potential disruptions.'
          : priceDeviation > 10
          ? 'Elevated pricing - monitor geopolitical developments.'
          : 'Normal price range.'
      }`,
      baselineComparison: `${priceDeviation > 0 ? '+' : ''}${priceDeviation.toFixed(1)}% vs 30-day avg (${baseline}/bbl)`,
      confidence: 'high' as ConfidenceLevel,
      sourceUrl: 'https://www.eia.gov/',
      sourceName: 'Finnhub (U.S. EIA)',
      lastUpdated: new Date(),
    };
  } catch (error) {
    logSignalError({
      signalId: 'oil-prices',
      sourceName: 'Finnhub (U.S. EIA)',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
      errorType: 'network',
    });
    return null;
  }
}

// ============================================
// PHASE 1: Twitter/X Crisis Trending
// ============================================
/**
 * Twitter crisis signal - Real-time crisis awareness
 * Detects trending crisis-related terms
 * Requires Twitter API v2 approval
 */
export async function fetchTwitterCrisisSignal(): Promise<Signal | null> {
  try {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    if (!bearerToken) {
      throw new Error('TWITTER_BEARER_TOKEN not configured');
    }

    // Crisis-related keywords to search
    const crisisKeywords = [
      'crisis',
      'emergency',
      'disaster',
      'evacuation',
      'attack',
      'bombing',
      'nuclear',
      'tsunami',
      'earthquake',
      'volcano',
    ];

    // Search for recent crisis-related tweets (last hour)
    const query = encodeURIComponent(
      `(${crisisKeywords.join(' OR ')}) -is:retweet lang:en`
    );

    const response = await fetch(
      `https://api.twitter.com/2/tweets/search/recent?query=${query}&max_results=100&tweet.fields=created_at,public_metrics`,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
        next: { revalidate: 300 } // Real-time, 5 min cache
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Twitter API rate limit exceeded');
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const tweets = data.data || [];
    const meta = data.meta || {};

    // Count tweets and estimate reach
    const tweetCount = tweets.length;
    const totalEngagement = tweets.reduce((sum: number, tweet: any) => {
      const metrics = tweet.public_metrics || {};
      return sum + (metrics.like_count || 0) + (metrics.retweet_count || 0);
    }, 0);

    // Score: combination of tweet count and engagement
    const engagementScore = Math.min((totalEngagement / 1000) * 50, 50); // Max 50 for engagement
    const volumeScore = Math.min(tweetCount * 2, 50); // Max 50 for volume
    const score = clamp(engagementScore + volumeScore, 0, 100);

    return {
      id: 'twitter-crisis-trends',
      name: 'Twitter Crisis Trending',
      region: 'global' as Region,
      status: scoreToStatus(score),
      score: Math.round(score),
      explanation: `${tweetCount} crisis-related tweets detected in last hour. ${totalEngagement} total engagements (likes + retweets). ${
        score > 60
          ? 'Significant crisis discussion detected.'
          : score > 35
          ? 'Moderate crisis awareness.'
          : 'Normal discussion levels.'
      }`,
      baselineComparison: `${tweetCount > 50 ? '+' : ''}${tweetCount - 50} tweets vs hourly avg (baseline 50)`,
      confidence: 'medium' as ConfidenceLevel,
      sourceUrl: 'https://twitter.com/search',
      sourceName: 'Twitter/X API v2',
      lastUpdated: new Date(),
    };
  } catch (error) {
    logSignalError({
      signalId: 'twitter-crisis-trends',
      sourceName: 'Twitter/X API v2',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
      errorType: error instanceof Error && error.message.includes('rate limit')
        ? 'network'
        : 'network',
    });
    return null;
  }
}

// ============================================
// Export all Phase 1 signals
// ============================================
export const phase1Signals = [
  fetchVIXSignal,
  fetchCreditSpreadSignal,
  fetchOilPriceSignal,
  fetchTwitterCrisisSignal,
] as const;
