'use client';

import { Signal } from '@/types';
import { REGION_LABELS } from '@/types';
import { formatRelativeTime } from '@/lib/utils';

interface SignalCardProps {
  signal: Signal;
  index: number;
}

function StatusDot({ status, size = 'sm' }: { status: string; size?: 'sm' | 'lg' }) {
  const colors: Record<string, string> = {
    normal: 'bg-emerald-500',
    elevated: 'bg-amber-500',
    high: 'bg-red-500 animate-pulse',
  };
  const sizeClass = size === 'lg' ? 'w-3 h-3' : 'w-2 h-2';
  return <span className={`${sizeClass} rounded-full ${colors[status] || 'bg-zinc-500'}`} />;
}

function ConfidenceMeter({ level }: { level: string }) {
  const filled = level === 'high' ? 3 : level === 'medium' ? 2 : 1;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={`w-1 h-3 ${i <= filled ? 'bg-zinc-500' : 'bg-zinc-800'}`}
        />
      ))}
    </div>
  );
}

export function SignalCard({ signal, index }: SignalCardProps) {
  const isHigh = signal.status === 'high';
  const isElevated = signal.status === 'elevated';
  const isFeatured = isHigh || (isElevated && index < 2);

  const statusColors: Record<string, string> = {
    normal: 'text-emerald-400',
    elevated: 'text-amber-400',
    high: 'text-red-400',
  };

  const statusBorders: Record<string, string> = {
    normal: 'border-zinc-800 hover:border-zinc-700',
    elevated: 'border-amber-500/20 hover:border-amber-500/40',
    high: 'border-red-500/30 hover:border-red-500/50',
  };

  // High signals span 2 columns, first elevated spans 2 on larger screens
  const colSpan = isHigh
    ? 'md:col-span-2 lg:col-span-2'
    : isElevated && index < 2
    ? 'md:col-span-2 lg:col-span-1'
    : '';

  return (
    <div
      className={`border bg-zinc-900/20 transition-all duration-200 animate-fade-in ${statusBorders[signal.status]} ${colSpan}`}
      style={{ animationDelay: `${index * 30}ms` }}
    >
      <div className={isFeatured ? 'p-5' : 'p-4'}>
        {/* Top row: Status + Name + Score */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <StatusDot status={signal.status} size={isFeatured ? 'lg' : 'sm'} />
            <div className="min-w-0">
              <h3 className={`font-medium text-zinc-200 ${isFeatured ? 'text-base' : 'text-sm'} ${isHigh ? '' : 'truncate'}`}>
                {signal.name}
              </h3>
              <div className="text-[10px] text-zinc-600 uppercase tracking-wider">
                {REGION_LABELS[signal.region]}
              </div>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className={`font-bold tabular-nums ${statusColors[signal.status]} ${isFeatured ? 'text-3xl' : 'text-2xl'}`}>
              {signal.score}
            </div>
          </div>
        </div>

        {/* Explanation */}
        <p className={`text-zinc-400 leading-relaxed mb-4 ${isFeatured ? 'text-sm' : 'text-xs line-clamp-2'}`}>
          {signal.explanation}
        </p>

        {/* Bottom row: Metrics */}
        <div className="flex items-center justify-between text-[10px] flex-wrap gap-2">
          <div className="flex items-center gap-4">
            {/* Delta */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-600">Δ</span>
              <span className={`font-mono ${
                signal.baselineComparison.startsWith('+')
                  ? 'text-amber-400/80'
                  : signal.baselineComparison.startsWith('-')
                  ? 'text-emerald-400/80'
                  : 'text-zinc-500'
              }`}>
                {signal.baselineComparison}
              </span>
            </div>

            {/* Confidence */}
            <div className="flex items-center gap-1.5">
              <span className="text-zinc-600">CONF</span>
              <ConfidenceMeter level={signal.confidence} />
            </div>
          </div>

          {/* Source + Time */}
          <div className="flex items-center gap-3 text-zinc-600">
            <span>{formatRelativeTime(signal.lastUpdated)}</span>
            <a
              href={signal.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-zinc-400 transition-colors"
            >
              {signal.sourceName} →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
