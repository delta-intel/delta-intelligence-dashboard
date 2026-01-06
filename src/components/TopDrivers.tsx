'use client';

import { Signal } from '@/types';

interface TopDriversProps {
  signals: Signal[];
}

function getContribution(signal: Signal, total: number): number {
  // Contribution based on how much this signal deviates from baseline (score 50 = neutral)
  const deviation = Math.abs(signal.score - 50);
  return Math.round((deviation / total) * 100);
}

export function TopDrivers({ signals }: TopDriversProps) {
  // Get top 3 drivers by deviation from baseline (furthest from 50)
  const drivers = [...signals]
    .map(s => ({ ...s, deviation: Math.abs(s.score - 50) }))
    .sort((a, b) => b.deviation - a.deviation)
    .slice(0, 3);

  const totalDeviation = drivers.reduce((sum, d) => sum + d.deviation, 0) || 1;

  if (drivers.length === 0) {
    return (
      <div className="border border-zinc-800 bg-zinc-900/30 p-4">
        <div className="text-zinc-600 text-xs">No signals available</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {drivers.map((driver, i) => {
        const contribution = getContribution(driver, totalDeviation);
        const isElevated = driver.status === 'elevated' || driver.status === 'high';

        return (
          <div
            key={driver.id}
            className={`border bg-zinc-900/30 p-4 transition-all ${
              driver.status === 'high'
                ? 'border-red-500/30'
                : driver.status === 'elevated'
                ? 'border-amber-500/20'
                : 'border-zinc-800'
            }`}
          >
            {/* Rank */}
            <div className="flex items-start justify-between mb-2">
              <span className="text-zinc-600 text-[10px] font-mono">#{i + 1}</span>
              <span className={`text-lg font-bold tabular-nums ${
                driver.status === 'high'
                  ? 'text-red-400'
                  : driver.status === 'elevated'
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}>
                {driver.score}
              </span>
            </div>

            {/* Name */}
            <div className="text-sm text-zinc-200 font-medium mb-1 truncate">
              {driver.name}
            </div>

            {/* Contribution bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="text-zinc-600">contribution</span>
                <span className={`font-mono ${isElevated ? 'text-zinc-300' : 'text-zinc-500'}`}>
                  {contribution}%
                </span>
              </div>
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    driver.status === 'high'
                      ? 'bg-red-500'
                      : driver.status === 'elevated'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${contribution}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
