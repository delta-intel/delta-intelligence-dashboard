'use client';

import { GlobalRisk } from '@/types';
import { getTrendIcon, getTrendColor, getRiskLevel, formatRelativeTime } from '@/lib/utils';

interface GlobalRiskOverviewProps {
  risk: GlobalRisk;
  isLoading?: boolean;
}

function AsciiMeter({ value, width = 20 }: { value: number; width?: number }) {
  const filled = Math.round((value / 100) * width);
  const empty = width - filled;

  let color = 'text-emerald-500';
  if (value >= 60) color = 'text-amber-500';
  if (value >= 80) color = 'text-red-500';

  return (
    <div className="font-mono text-xs">
      <span className="text-zinc-600">[</span>
      <span className={color}>{'█'.repeat(filled)}</span>
      <span className="text-zinc-800">{'░'.repeat(empty)}</span>
      <span className="text-zinc-600">]</span>
    </div>
  );
}

export function GlobalRiskOverview({ risk, isLoading }: GlobalRiskOverviewProps) {
  const { label, color } = getRiskLevel(risk.score);
  const glowClass = risk.score >= 80 ? 'glow-red' : risk.score >= 60 ? 'glow-amber' : 'glow-green';

  return (
    <div className="border border-zinc-800 bg-zinc-950 p-4">
      <div className="text-zinc-600 text-xs mb-3">
        ╭─ GLOBAL RISK ASSESSMENT ─────────────────────────────────╮
      </div>

      <div className="pl-2">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-baseline gap-2 mb-2">
              <span
                className={`text-4xl font-bold tabular-nums ${color} ${glowClass} ${
                  isLoading ? 'animate-pulse' : ''
                }`}
              >
                {String(risk.score).padStart(2, '0')}
              </span>
              <span className="text-zinc-600">/100</span>
              <span className={`text-xl ${getTrendColor(risk.trend)}`}>
                {getTrendIcon(risk.trend)}
              </span>
            </div>

            <AsciiMeter value={risk.score} width={24} />

            <div className="mt-3 flex items-center gap-4 text-xs">
              <span className={`${color} font-medium`}>STATUS: {label}</span>
              <span className="text-zinc-600">│</span>
              <span className="text-zinc-500">{risk.signalCount} SIGNALS</span>
            </div>
          </div>

          <div className="text-right text-xs">
            <div className="text-zinc-600">LAST_UPDATE:</div>
            <div className="text-zinc-400 font-mono">
              {formatRelativeTime(risk.lastUpdated)}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-zinc-800/50">
        <p className="text-[10px] text-zinc-600 leading-relaxed">
          ⚠ EXPERIMENTAL SIGNALS FROM PUBLIC DATA. NOT PREDICTIONS.
        </p>
      </div>

      <div className="text-zinc-600 text-xs mt-3">
        ╰──────────────────────────────────────────────────────────╯
      </div>
    </div>
  );
}
