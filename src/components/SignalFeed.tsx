'use client';

import { Signal } from '@/types';
import { SignalCard } from './SignalCard';

interface SignalFeedProps {
  signals: Signal[];
  isLoading?: boolean;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border border-zinc-800 bg-zinc-900/20 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 bg-zinc-800 rounded-full animate-pulse" />
            <div className="h-4 w-40 bg-zinc-800/50 animate-pulse" />
            <div className="ml-auto h-6 w-10 bg-zinc-800/50 animate-pulse" />
          </div>
          <div className="h-3 w-full bg-zinc-800/30 animate-pulse mb-2" />
          <div className="h-3 w-2/3 bg-zinc-800/30 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function SignalFeed({ signals, isLoading }: SignalFeedProps) {
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (signals.length === 0) {
    return (
      <div className="border border-zinc-800 bg-zinc-900/20 p-8 text-center">
        <div className="text-zinc-600 text-sm">No signals match current filters</div>
      </div>
    );
  }

  // Sort: high first, then elevated, then normal
  const sorted = [...signals].sort((a, b) => {
    const order = { high: 0, elevated: 1, normal: 2 };
    return (order[a.status] ?? 3) - (order[b.status] ?? 3);
  });

  return (
    <div className="space-y-3">
      {sorted.map((signal, index) => (
        <SignalCard key={signal.id} signal={signal} index={index} />
      ))}
    </div>
  );
}
