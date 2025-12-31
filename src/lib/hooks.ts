'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Signal, Region, GlobalRisk, DashboardState } from '@/types';
import { fetchAllSignals, calculateGlobalRisk, filterSignalsByRegion, calculateRegionalRisk } from './signals';

const POLL_INTERVAL = 60000; // 60 seconds

interface UseDashboardReturn extends DashboardState {
  refresh: () => Promise<void>;
  setSelectedRegion: (region: Region) => void;
  filteredSignals: Signal[];
  regionalScore: number;
}

export function useDashboard(): UseDashboardReturn {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [globalRisk, setGlobalRisk] = useState<GlobalRisk>({
    score: 0,
    trend: 'stable',
    lastUpdated: new Date(),
    signalCount: 0,
  });
  const [selectedRegion, setSelectedRegion] = useState<Region>('global');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const previousScoreRef = useRef<number | undefined>(undefined);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const newSignals = await fetchAllSignals();
      const newGlobalRisk = calculateGlobalRisk(newSignals, previousScoreRef.current);

      setSignals(newSignals);
      setGlobalRisk(newGlobalRisk);
      setLastFetched(new Date());
      setError(null);

      previousScoreRef.current = newGlobalRisk.score;
    } catch (err) {
      setError('Failed to fetch signals. Check your connection.');
      console.error('Dashboard fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchData();
  }, [fetchData]);

  // Initial fetch and polling
  useEffect(() => {
    fetchData();

    pollIntervalRef.current = setInterval(fetchData, POLL_INTERVAL);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchData]);

  // Computed values
  const filteredSignals = filterSignalsByRegion(signals, selectedRegion);
  const regionalScore = calculateRegionalRisk(signals, selectedRegion);

  return {
    signals,
    globalRisk,
    selectedRegion,
    isLoading,
    error,
    lastFetched,
    refresh,
    setSelectedRegion,
    filteredSignals,
    regionalScore,
  };
}
