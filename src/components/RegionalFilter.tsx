'use client';

import { Region, REGION_LABELS } from '@/types';

interface RegionalFilterProps {
  selectedRegion: Region;
  onRegionChange: (region: Region) => void;
  regionalScore?: number;
}

const REGIONS: Region[] = [
  'global',
  'north-america',
  'europe',
  'asia-pacific',
  'middle-east',
  'africa',
  'south-america',
];

export function RegionalFilter({
  selectedRegion,
  onRegionChange,
  regionalScore,
}: RegionalFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 text-xs">
      <span className="text-zinc-600">REGION:</span>
      <div className="flex flex-wrap items-center gap-2">
        {REGIONS.map((region) => (
          <button
            key={region}
            onClick={() => onRegionChange(region)}
            className={`px-2 py-1 border transition-colors ${
              selectedRegion === region
                ? 'border-emerald-500/50 text-emerald-500 bg-emerald-500/10'
                : 'border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-400'
            }`}
          >
            {REGION_LABELS[region].toUpperCase()}
          </button>
        ))}
      </div>

      {selectedRegion !== 'global' && regionalScore !== undefined && (
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-zinc-600">REGIONAL_SCORE:</span>
          <span className="text-zinc-300 font-bold tabular-nums">
            {String(regionalScore).padStart(2, '0')}
          </span>
        </div>
      )}
    </div>
  );
}
