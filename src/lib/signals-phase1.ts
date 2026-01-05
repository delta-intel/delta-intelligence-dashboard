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
 * Uses Yahoo Finance API (free, no auth required)
 */
export async function fetchVIXSignal(): Promise<Signal | null> {
  try {
    // Yahoo Finance API for VIX - free and reliable
    const response = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/%5EVIX?interval=1d&range=1d',
      {
        next: { revalidate: 300 }, // Cache for 5 minutes
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; signal-fetcher/1.0)'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];

    if (!result) {
      throw new Error('No VIX data in response');
    }

    // Get the most recent close price
    const meta = result.meta;
    const vixLevel = meta?.regularMarketPrice || meta?.previousClose;

    if (!vixLevel || isNaN(vixLevel)) {
      throw new Error('Could not parse VIX value');
    }

    // VIX baseline: 15-20 is normal, >25 is elevated, >30 is high anxiety
    const score = clamp((vixLevel / 40) * 100, 0, 100);

    return {
      id: 'vix-fear-index',
      name: 'Market Volatility Index (VIX)',
      region: 'global' as Region,
      status: scoreToStatus(score),
      score: Math.round(score),
      explanation: `VIX at ${vixLevel.toFixed(1)}. ${
        vixLevel > 30
          ? 'High market anxiety - fear in markets.'
          : vixLevel > 25
          ? 'Elevated market anxiety.'
          : vixLevel > 20
          ? 'Slightly elevated volatility.'
          : 'Normal market conditions.'
      }`,
      baselineComparison: `${((vixLevel - 17.5) / 17.5 * 100).toFixed(1)}% vs historical avg (17.5)`,
      confidence: 'high' as ConfidenceLevel,
      sourceUrl: 'https://finance.yahoo.com/quote/%5EVIX',
      sourceName: 'Yahoo Finance (VIX)',
      lastUpdated: new Date(),
    };
  } catch (error) {
    logSignalError({
      signalId: 'vix-fear-index',
      sourceName: 'Yahoo Finance VIX',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
      errorType: 'network',
    });
    return null;
  }
}

// ============================================
// PHASE 1: Credit Market Spreads (10Y-2Y Yield)
// ============================================
/**
 * Credit spreads signal - Yield curve inversion indicator
 * Uses FRED API with observations endpoint
 * Inverted yield curve (spread < 0) predicts recessions
 */
export async function fetchCreditSpreadSignal(): Promise<Signal | null> {
  try {
    const fredKey = process.env.FRED_API_KEY;

    // If no FRED key, use Treasury yield spread from Yahoo Finance
    if (!fredKey) {
      // Use Yahoo Finance for 10Y Treasury yield
      const response = await fetch(
        'https://query1.finance.yahoo.com/v8/finance/chart/%5ETNX?interval=1d&range=5d',
        {
          next: { revalidate: 3600 },
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; signal-fetcher/1.0)' }
        }
      );

      if (!response.ok) {
        throw new Error('Yahoo Finance unavailable');
      }

      const data = await response.json();
      const meta = data?.chart?.result?.[0]?.meta;
      const yield10y = meta?.regularMarketPrice || meta?.previousClose;

      if (!yield10y) throw new Error('No yield data');

      // 10Y yield indicator (not spread, but still useful)
      // High yields (>4.5%) indicate tighter financial conditions
      const score = clamp((yield10y / 6) * 100, 0, 100);

      return {
        id: 'credit-spreads',
        name: 'Treasury Yield (10Y)',
        region: 'global' as Region,
        status: scoreToStatus(score),
        score: Math.round(score),
        explanation: `10Y Treasury yield at ${yield10y.toFixed(2)}%. ${
          yield10y > 5
            ? 'Very high rates - tight financial conditions.'
            : yield10y > 4.5
            ? 'Elevated rates - monitor for stress.'
            : 'Normal rate environment.'
        }`,
        baselineComparison: `${((yield10y - 4.0) / 4.0 * 100).toFixed(1)}% vs baseline (4.0%)`,
        confidence: 'medium' as ConfidenceLevel,
        sourceUrl: 'https://finance.yahoo.com/quote/%5ETNX',
        sourceName: 'Yahoo Finance (10Y Yield)',
        lastUpdated: new Date(),
      };
    }

    // Use FRED with proper observations endpoint
    const res10y = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=DGS10&api_key=${fredKey}&file_type=json&limit=1&sort_order=desc`,
      { next: { revalidate: 86400 } }
    );

    const res2y = await fetch(
      `https://api.stlouisfed.org/fred/series/observations?series_id=DGS2&api_key=${fredKey}&file_type=json&limit=1&sort_order=desc`,
      { next: { revalidate: 86400 } }
    );

    if (!res10y.ok || !res2y.ok) {
      throw new Error(`FRED API error: 10Y=${res10y.status}, 2Y=${res2y.status}`);
    }

    const data10y = await res10y.json();
    const data2y = await res2y.json();

    const obs10y = data10y.observations || [];
    const obs2y = data2y.observations || [];

    if (obs10y.length === 0 || obs2y.length === 0) {
      throw new Error('No observations from FRED');
    }

    const yield10y = parseFloat(obs10y[0].value);
    const yield2y = parseFloat(obs2y[0].value);

    if (isNaN(yield10y) || isNaN(yield2y)) {
      throw new Error('Invalid yield data');
    }

    const spread = yield10y - yield2y;

    // Inverted yield curve (spread < 0) is recession signal
    const score = clamp(50 - spread * 30, 0, 100);

    return {
      id: 'credit-spreads',
      name: 'Yield Curve Spread (10Y-2Y)',
      region: 'global' as Region,
      status: scoreToStatus(score),
      score: Math.round(score),
      explanation: `10Y-2Y spread at ${(spread * 100).toFixed(0)}bps. ${
        spread < 0
          ? 'Inverted yield curve - recession warning.'
          : spread < 0.25
          ? 'Flat curve - watch for inversion.'
          : 'Normal yield curve.'
      }`,
      baselineComparison: `10Y: ${yield10y.toFixed(2)}%, 2Y: ${yield2y.toFixed(2)}%`,
      confidence: 'high' as ConfidenceLevel,
      sourceUrl: 'https://fred.stlouisfed.org/',
      sourceName: 'FRED (Federal Reserve)',
      lastUpdated: new Date(),
    };
  } catch (error) {
    logSignalError({
      signalId: 'credit-spreads',
      sourceName: 'FRED/Yahoo Finance',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
      errorType: 'network',
    });
    return null;
  }
}

// ============================================
// PHASE 1: Oil Price (WTI Crude)
// ============================================
/**
 * Oil price signal - Supply disruption and geopolitical stress
 * Uses Yahoo Finance for WTI crude oil futures
 */
export async function fetchOilPriceSignal(): Promise<Signal | null> {
  try {
    // Yahoo Finance for WTI Crude Oil futures (CL=F)
    const response = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/CL=F?interval=1d&range=1d',
      {
        next: { revalidate: 300 },
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; signal-fetcher/1.0)' }
      }
    );

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];

    if (!result) {
      throw new Error('No oil price data');
    }

    const meta = result.meta;
    const currentPrice = meta?.regularMarketPrice || meta?.previousClose;

    if (!currentPrice || isNaN(currentPrice)) {
      throw new Error('Could not parse oil price');
    }

    // Baseline: ~$70-75/barrel is normal
    const baseline = 72;
    const priceDeviation = ((currentPrice - baseline) / baseline) * 100;

    // Score: deviation from baseline
    const score = clamp(45 + priceDeviation * 0.6, 0, 100);

    return {
      id: 'oil-prices',
      name: 'WTI Crude Oil Price',
      region: 'global' as Region,
      status: scoreToStatus(score),
      score: Math.round(score),
      explanation: `WTI crude at $${currentPrice.toFixed(2)}/barrel. ${
        currentPrice > 100
          ? 'Extreme prices - major supply disruption.'
          : currentPrice > 90
          ? 'High prices - supply concerns.'
          : currentPrice > 80
          ? 'Elevated prices - monitor geopolitical risk.'
          : currentPrice < 50
          ? 'Very low prices - demand destruction.'
          : 'Normal price range.'
      }`,
      baselineComparison: `${priceDeviation > 0 ? '+' : ''}${priceDeviation.toFixed(1)}% vs baseline ($${baseline}/bbl)`,
      confidence: 'high' as ConfidenceLevel,
      sourceUrl: 'https://finance.yahoo.com/quote/CL=F',
      sourceName: 'Yahoo Finance (WTI Crude)',
      lastUpdated: new Date(),
    };
  } catch (error) {
    logSignalError({
      signalId: 'oil-prices',
      sourceName: 'Yahoo Finance Oil',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
      errorType: 'network',
    });
    return null;
  }
}

// ============================================
// PHASE 1: Gold Price (Safe Haven)
// ============================================
/**
 * Gold price signal - Safe haven demand indicator
 * Rising gold = increased fear/uncertainty
 */
export async function fetchGoldPriceSignal(): Promise<Signal | null> {
  try {
    // Yahoo Finance for Gold futures (GC=F)
    const response = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=5d',
      {
        next: { revalidate: 300 },
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; signal-fetcher/1.0)' }
      }
    );

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];

    if (!result) {
      throw new Error('No gold price data');
    }

    const meta = result.meta;
    const currentPrice = meta?.regularMarketPrice || meta?.previousClose;
    const quotes = result.indicators?.quote?.[0];
    const closes = quotes?.close?.filter((c: number | null) => c !== null) || [];

    // Calculate 5-day change
    const prevPrice = closes.length > 1 ? closes[0] : currentPrice;
    const priceChange = ((currentPrice - prevPrice) / prevPrice) * 100;

    if (!currentPrice || isNaN(currentPrice)) {
      throw new Error('Could not parse gold price');
    }

    // High gold prices and rising = flight to safety
    // Score based on price level and momentum
    const baseline = 2000; // $2000/oz baseline
    const levelScore = ((currentPrice - baseline) / baseline) * 30;
    const momentumScore = priceChange * 3;
    const score = clamp(40 + levelScore + momentumScore, 0, 100);

    return {
      id: 'gold-safe-haven',
      name: 'Gold Price (Safe Haven)',
      region: 'global' as Region,
      status: scoreToStatus(score),
      score: Math.round(score),
      explanation: `Gold at $${currentPrice.toFixed(0)}/oz (${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(1)}% 5d). ${
        priceChange > 3
          ? 'Strong safe haven buying - elevated fear.'
          : priceChange > 1
          ? 'Rising gold demand - some caution.'
          : priceChange < -2
          ? 'Gold selling - risk appetite returning.'
          : 'Stable gold market.'
      }`,
      baselineComparison: `${((currentPrice - baseline) / baseline * 100).toFixed(1)}% vs $${baseline} baseline`,
      confidence: 'high' as ConfidenceLevel,
      sourceUrl: 'https://finance.yahoo.com/quote/GC=F',
      sourceName: 'Yahoo Finance (Gold)',
      lastUpdated: new Date(),
    };
  } catch (error) {
    logSignalError({
      signalId: 'gold-safe-haven',
      sourceName: 'Yahoo Finance Gold',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
      errorType: 'network',
    });
    return null;
  }
}

// ============================================
// PHASE 1: US Dollar Index (DXY)
// ============================================
/**
 * Dollar index signal - Global stress indicator
 * Rising DXY = flight to dollar safety
 */
export async function fetchDollarIndexSignal(): Promise<Signal | null> {
  try {
    // Yahoo Finance for US Dollar Index (DX-Y.NYB)
    const response = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/DX-Y.NYB?interval=1d&range=5d',
      {
        next: { revalidate: 300 },
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; signal-fetcher/1.0)' }
      }
    );

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json();
    const result = data?.chart?.result?.[0];

    if (!result) {
      throw new Error('No DXY data');
    }

    const meta = result.meta;
    const currentDxy = meta?.regularMarketPrice || meta?.previousClose;
    const quotes = result.indicators?.quote?.[0];
    const closes = quotes?.close?.filter((c: number | null) => c !== null) || [];

    const prevDxy = closes.length > 1 ? closes[0] : currentDxy;
    const dxyChange = ((currentDxy - prevDxy) / prevDxy) * 100;

    if (!currentDxy || isNaN(currentDxy)) {
      throw new Error('Could not parse DXY');
    }

    // Strong dollar (>105) + rising = global stress
    const baseline = 100;
    const levelScore = ((currentDxy - baseline) / baseline) * 40;
    const momentumScore = dxyChange * 5;
    const score = clamp(35 + levelScore + momentumScore, 0, 100);

    return {
      id: 'dollar-index',
      name: 'US Dollar Index (DXY)',
      region: 'global' as Region,
      status: scoreToStatus(score),
      score: Math.round(score),
      explanation: `DXY at ${currentDxy.toFixed(1)} (${dxyChange >= 0 ? '+' : ''}${dxyChange.toFixed(2)}% 5d). ${
        currentDxy > 108 && dxyChange > 1
          ? 'Strong dollar surge - global flight to safety.'
          : currentDxy > 105
          ? 'Elevated dollar - emerging market stress.'
          : currentDxy < 95
          ? 'Weak dollar - risk-on environment.'
          : 'Normal dollar trading.'
      }`,
      baselineComparison: `${((currentDxy - baseline) / baseline * 100).toFixed(1)}% vs baseline (${baseline})`,
      confidence: 'high' as ConfidenceLevel,
      sourceUrl: 'https://finance.yahoo.com/quote/DX-Y.NYB',
      sourceName: 'Yahoo Finance (DXY)',
      lastUpdated: new Date(),
    };
  } catch (error) {
    logSignalError({
      signalId: 'dollar-index',
      sourceName: 'Yahoo Finance DXY',
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date(),
      errorType: 'network',
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
  fetchGoldPriceSignal,
  fetchDollarIndexSignal,
] as const;
