'use client';

import { formatRelativeTime } from '@/lib/utils';
import { Signal, GlobalRisk } from '@/types';

interface HeaderProps {
  lastUpdated: Date | null;
  isLive: boolean;
  globalRisk?: GlobalRisk;
  signals?: Signal[];
}

function Marquee({ signals, lastUpdated }: { signals?: Signal[]; lastUpdated: Date | null }) {
  const highSignals = signals?.filter(s => s.status === 'high') || [];

  const items = [
    'MONITORING ACTIVE',
    highSignals.length > 0 ? `${highSignals.length} HIGH PRIORITY SIGNAL${highSignals.length > 1 ? 'S' : ''}` : 'NO HIGH PRIORITY ALERTS',
    'WIKIPEDIA API',
    'FOREX RATES',
    'NETWORK STATUS',
    'GPS INTERFERENCE',
    'TRAFFIC PATTERNS',
    lastUpdated ? `UPDATED ${formatRelativeTime(lastUpdated).toUpperCase()}` : 'CONNECTING',
  ];

  const marqueeText = items.join('   ·   ');

  return (
    <div className="w-full bg-emerald-500/5 border-b border-emerald-500/10 overflow-hidden">
      <div className="marquee-container py-1">
        <div className="marquee-content">
          <span className="text-[9px] text-emerald-500/70 tracking-[0.25em] uppercase whitespace-nowrap">
            {marqueeText}
          </span>
          <span className="text-[9px] text-emerald-500/70 tracking-[0.25em] uppercase whitespace-nowrap ml-24">
            {marqueeText}
          </span>
        </div>
      </div>
    </div>
  );
}

export function Header({ lastUpdated, isLive, globalRisk, signals }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50">
      <div className="border-b border-zinc-800/50 bg-zinc-950/95 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-4">
          <div className="flex items-center justify-between h-14">

            {/* Logo */}
            <div className="flex items-center gap-3">
              <span className="text-xl text-emerald-500">△</span>
              <div className="flex items-baseline gap-2">
                <span className="text-emerald-500 font-semibold tracking-wide text-sm">DELTA INTELLIGENCE</span>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-4">
              {isLive && (
                <div className="flex items-center gap-2">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="pulse-ring absolute inline-flex h-full w-full rounded-full bg-emerald-500"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-emerald-500/80 text-[10px] tracking-wider">LIVE</span>
                </div>
              )}

              {lastUpdated && (
                <span className="text-zinc-600 text-[10px] hidden sm:inline">
                  {formatRelativeTime(lastUpdated)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      <Marquee signals={signals} lastUpdated={lastUpdated} />
    </header>
  );
}
