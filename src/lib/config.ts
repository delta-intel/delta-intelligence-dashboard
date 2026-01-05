/**
 * Configuration for data sources
 * BUG #3 FIX: Centralized baseline management for currency signals
 */

export interface CurrencyBaselines {
  CHF: number;
  JPY: number;
  XAU: number;
  lastUpdated: Date;
}

/**
 * Safe-haven currency baselines for risk calculation
 * These should be updated monthly or fetched dynamically from historical data
 * Last updated: January 4, 2025
 */
export const CURRENCY_BASELINES: CurrencyBaselines = {
  CHF: 0.92, // CHF/USD baseline
  JPY: 145, // JPY/USD baseline
  XAU: 2050, // Gold baseline (USD/oz)
  lastUpdated: new Date('2025-01-04'),
};

/**
 * Update baselines (call this when data is stale)
 */
export function updateCurrencyBaselines(baselines: Partial<CurrencyBaselines>) {
  if (baselines.CHF !== undefined) CURRENCY_BASELINES.CHF = baselines.CHF;
  if (baselines.JPY !== undefined) CURRENCY_BASELINES.JPY = baselines.JPY;
  if (baselines.XAU !== undefined) CURRENCY_BASELINES.XAU = baselines.XAU;
  CURRENCY_BASELINES.lastUpdated = new Date();
}

/**
 * Stricter crisis keywords for Wikipedia filtering
 * BUG #4 FIX: More specific keywords to reduce false positives
 */
export const CRISIS_KEYWORDS = [
  // Military/Conflict specific
  'Military_invasion',
  'Armed_conflict',
  'War_crime',
  'Coup_d_état',
  'Insurgency',
  'Guerrilla_warfare',

  // Nuclear/WMD specific
  'Nuclear_weapons',
  'Nuclear_explosion',
  'Nuclear_incident',
  'Chemical_weapons',
  'Biological_weapons',

  // Terrorism/Attack specific
  'Terrorism',
  'Terrorist_attack',
  'Mass_casualty_event',
  'Suicide_bombing',
  'Hostage_situation',

  // Government crisis
  'Assassination_attempt',
  'Political_assassination',
  'Martial_law_declaration',
  'Government_overthrow',
  'State_emergency',

  // International incident
  'International_incident',
  'Border_conflict',
  'Diplomatic_crisis',
];

/**
 * Check if an article title indicates a real crisis (not fiction)
 */
export function isCrisisArticle(title: string, keywords: string[]): boolean {
  const lowerTitle = title.toLowerCase();

  // Exclude fictional content
  if (
    lowerTitle.includes('fiction') ||
    lowerTitle.includes('novel') ||
    lowerTitle.includes('film') ||
    lowerTitle.includes('movie') ||
    lowerTitle.includes('game')
  ) {
    return false;
  }

  // Require at least one keyword match
  return keywords.some(kw => lowerTitle.includes(kw.toLowerCase()));
}

/**
 * Region boundary coordinates for improved detection
 * BUG #6 FIX: More accurate geographic region detection
 */
export const REGION_BOUNDARIES: Record<
  string,
  { lat: [number, number]; lng: [number, number] }
> = {
  'north-america': {
    lat: [15, 75],
    lng: [-170, -50],
  },
  'europe': {
    lat: [35, 72],
    lng: [-10, 60],
  },
  'asia-pacific': {
    lat: [-60, 60],
    lng: [60, 180],
  },
  'south-america': {
    lat: [-56, 13],
    lng: [-82, -35],
  },
  'africa': {
    lat: [-35, 40],
    lng: [-18, 55],
  },
  'middle-east': {
    lat: [10, 45],
    lng: [25, 75],
  },
};

/**
 * Detect region from coordinates with improved accuracy
 */
export function detectRegionFromCoordinates(lat: number, lng: number): string {
  for (const [region, bounds] of Object.entries(REGION_BOUNDARIES)) {
    const [minLat, maxLat] = bounds.lat;
    const [minLng, maxLng] = bounds.lng;

    if (lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng) {
      return region;
    }
  }

  return 'global';
}

/**
 * OpenSky API regional bounding boxes for global coverage
 * BUG #5 FIX: Support for multiple regions instead of just N. America
 */
export const OPENSKY_REGIONS = [
  {
    name: 'north-america',
    bounds: {
      lamin: 15,
      lomin: -130,
      lamax: 55,
      lomax: -50,
    },
  },
  {
    name: 'europe',
    bounds: {
      lamin: 35,
      lomin: -10,
      lamax: 72,
      lomax: 40,
    },
  },
  {
    name: 'asia-pacific',
    bounds: {
      lamin: -10,
      lomin: 60,
      lamax: 60,
      lomax: 180,
    },
  },
  {
    name: 'south-america',
    bounds: {
      lamin: -56,
      lomin: -82,
      lamax: 13,
      lomax: -35,
    },
  },
  {
    name: 'africa',
    bounds: {
      lamin: -35,
      lomin: -18,
      lamax: 40,
      lomax: 55,
    },
  },
  {
    name: 'middle-east',
    bounds: {
      lamin: 10,
      lomin: 25,
      lamax: 45,
      lomax: 75,
    },
  },
];
