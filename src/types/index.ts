export type SignalStatus = 'normal' | 'elevated' | 'high';
export type ConfidenceLevel = 'low' | 'medium' | 'high';
export type TrendDirection = 'up' | 'down' | 'stable';

export type Region =
  | 'global'
  | 'north-america'
  | 'europe'
  | 'asia-pacific'
  | 'middle-east'
  | 'africa'
  | 'south-america';

export const REGION_LABELS: Record<Region, string> = {
  'global': 'Global',
  'north-america': 'North America',
  'europe': 'Europe',
  'asia-pacific': 'Asia-Pacific',
  'middle-east': 'Middle East',
  'africa': 'Africa',
  'south-america': 'South America',
};

export interface Signal {
  id: string;
  name: string;
  region: Region;
  status: SignalStatus;
  score: number; // 0-100
  explanation: string;
  baselineComparison: string;
  confidence: ConfidenceLevel;
  sourceUrl: string;
  sourceName: string;
  lastUpdated: Date;
  isMocked: boolean;
}

export interface GlobalRisk {
  score: number; // 0-100
  trend: TrendDirection;
  lastUpdated: Date;
  signalCount: number;
}

export interface DashboardState {
  globalRisk: GlobalRisk;
  signals: Signal[];
  selectedRegion: Region;
  isLoading: boolean;
  error: string | null;
  lastFetched: Date | null;
}
