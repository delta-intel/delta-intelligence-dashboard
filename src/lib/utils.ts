import { SignalStatus, ConfidenceLevel, TrendDirection } from '@/types';

export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  return date.toLocaleDateString();
}

export function getStatusColor(status: SignalStatus): string {
  switch (status) {
    case 'normal': return 'text-emerald-400';
    case 'elevated': return 'text-amber-400';
    case 'high': return 'text-red-400';
  }
}

export function getStatusBgColor(status: SignalStatus): string {
  switch (status) {
    case 'normal': return 'bg-emerald-400/10 border-emerald-400/30';
    case 'elevated': return 'bg-amber-400/10 border-amber-400/30';
    case 'high': return 'bg-red-400/10 border-red-400/30';
  }
}

export function getConfidenceColor(confidence: ConfidenceLevel): string {
  switch (confidence) {
    case 'low': return 'text-zinc-500';
    case 'medium': return 'text-zinc-400';
    case 'high': return 'text-zinc-300';
  }
}

export function getTrendIcon(trend: TrendDirection): string {
  switch (trend) {
    case 'up': return '↑';
    case 'down': return '↓';
    case 'stable': return '→';
  }
}

export function getTrendColor(trend: TrendDirection): string {
  switch (trend) {
    case 'up': return 'text-red-400';
    case 'down': return 'text-emerald-400';
    case 'stable': return 'text-zinc-400';
  }
}

export function getRiskLevel(score: number): { label: string; color: string } {
  if (score < 30) return { label: 'LOW', color: 'text-emerald-400' };
  if (score < 60) return { label: 'MODERATE', color: 'text-amber-400' };
  if (score < 80) return { label: 'ELEVATED', color: 'text-orange-400' };
  return { label: 'HIGH', color: 'text-red-400' };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function normalizeToScale(value: number, min: number, max: number): number {
  return clamp(((value - min) / (max - min)) * 100, 0, 100);
}
