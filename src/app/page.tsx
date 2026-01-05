'use client';

import dynamic from 'next/dynamic';
import { useDashboard } from '@/lib/hooks';
import {
  Header,
  SignalFeed,
  RegionalFilter,
  ErrorState,
} from '@/components';
import { getRiskLevel, getTrendIcon, getTrendColor } from '@/lib/utils';

// Dynamic import for map (client-side only)
const HeatMap = dynamic(() => import('@/components/HeatMap').then(mod => mod.HeatMap), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] bg-zinc-900 flex items-center justify-center">
      <span className="text-zinc-600 text-xs">Loading map...</span>
    </div>
  ),
});

export default function Dashboard() {
  const {
    globalRisk,
    selectedRegion,
    isLoading,
    error,
    lastFetched,
    setSelectedRegion,
    filteredSignals,
    regionalScore,
    refresh,
    signals,
  } = useDashboard();

  const { label, color } = getRiskLevel(globalRisk.score);
  const highCount = signals.filter(s => s.status === 'high').length;
  const elevatedCount = signals.filter(s => s.status === 'elevated').length;
  const normalCount = signals.length - highCount - elevatedCount;

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header
        lastUpdated={lastFetched}
        isLive={!isLoading && !error}
        globalRisk={globalRisk}
        signals={signals}
      />

      <main className="max-w-[1400px] mx-auto px-4 py-6">

        {/* HERO: Risk Score + Stats + Map */}
        <section className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

            {/* Left Side: Stats */}
            <div className="lg:col-span-5 grid grid-rows-[1fr_auto] gap-4">

              {/* Top Row: Risk Index + Signals Count */}
              <div className="grid grid-cols-2 gap-4">

                {/* Global Risk Index */}
                <div className="border border-zinc-800 bg-zinc-900/30 p-5 flex flex-col">
                  <div className="text-zinc-500 text-[10px] tracking-wider uppercase mb-3">
                    Global Risk Index
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className={`text-5xl font-bold tabular-nums leading-none ${color}`}>
                        {String(globalRisk.score).padStart(2, '0')}
                      </span>
                      <span className={`text-xl ${getTrendColor(globalRisk.trend)}`}>
                        {getTrendIcon(globalRisk.trend)}
                      </span>
                    </div>
                    <div className="text-zinc-600 text-xs mb-2">/100</div>
                  </div>
                  <div className={`text-sm font-medium ${color}`}>
                    {label}
                  </div>
                </div>

                {/* Signals Count */}
                <div className="border border-zinc-800 bg-zinc-900/30 p-5 flex flex-col">
                  <div className="text-zinc-500 text-[10px] tracking-wider uppercase mb-3">
                    Signals
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="text-4xl font-bold text-zinc-200 tabular-nums mb-1">
                      {signals.length}
                    </div>
                  </div>
                  <div className="text-zinc-600 text-xs">active</div>
                </div>
              </div>

              {/* Bottom Row: High / Elevated / Normal */}
              <div className="grid grid-cols-3 gap-4">

                {/* High */}
                <div className="border border-zinc-800 bg-zinc-900/30 p-4">
                  <div className="text-zinc-500 text-[10px] tracking-wider uppercase mb-2">
                    High
                  </div>
                  <div className={`text-2xl font-bold tabular-nums ${
                    highCount > 0 ? 'text-red-400' : 'text-zinc-700'
                  }`}>
                    {highCount}
                  </div>
                  <div className="text-zinc-600 text-[10px]">alerts</div>
                </div>

                {/* Elevated */}
                <div className={`border p-4 ${
                  elevatedCount > 0
                    ? 'border-emerald-500/30 bg-zinc-900/30'
                    : 'border-zinc-800 bg-zinc-900/30'
                }`}>
                  <div className="text-zinc-500 text-[10px] tracking-wider uppercase mb-2">
                    Elevated
                  </div>
                  <div className={`text-2xl font-bold tabular-nums ${
                    elevatedCount > 0 ? 'text-emerald-400' : 'text-zinc-700'
                  }`}>
                    {elevatedCount}
                  </div>
                  <div className="text-zinc-600 text-[10px]">signals</div>
                </div>

                {/* Normal */}
                <div className="border border-zinc-800 bg-zinc-900/30 p-4">
                  <div className="text-zinc-500 text-[10px] tracking-wider uppercase mb-2">
                    Normal
                  </div>
                  <div className="text-2xl font-bold text-emerald-400 tabular-nums">
                    {normalCount}
                  </div>
                  <div className="text-zinc-600 text-[10px]">signals</div>
                </div>
              </div>
            </div>

            {/* Right Side: Map */}
            <div className="lg:col-span-7">
              <div className="border border-zinc-800 bg-zinc-900/30 h-full min-h-[400px] lg:min-h-[400px] overflow-hidden">
                <HeatMap signals={signals} selectedRegion={selectedRegion} />
              </div>
            </div>
          </div>
        </section>

        {/* Regional Filter */}
        <section className="mb-6">
          <div className="border border-zinc-800/50 bg-zinc-900/20 p-4">
            <RegionalFilter
              selectedRegion={selectedRegion}
              onRegionChange={setSelectedRegion}
              regionalScore={selectedRegion !== 'global' ? regionalScore : undefined}
            />
          </div>
        </section>

        {/* Error State */}
        {error && (
          <section className="mb-6">
            <ErrorState message={error} onRetry={refresh} />
          </section>
        )}

        {/* Signal Feed */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] text-zinc-500 tracking-wider uppercase">
              Signal Details
            </h2>
            <span className="text-[10px] text-zinc-600">
              {filteredSignals.length} signal{filteredSignals.length !== 1 ? 's' : ''} in view
            </span>
          </div>
          <SignalFeed signals={filteredSignals} isLoading={isLoading} />
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-800/30 pt-6 pb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-[10px] text-zinc-700">
            <div className="flex items-center gap-2">
              <span className="text-emerald-500">△</span>
              <span>Delta Intelligence v0.1.0</span>
            </div>
            <div className="text-zinc-600">
              Sources: Wikimedia • Frankfurter • USGS • NASA EONET • GDELT • IODA • OpenSky
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
