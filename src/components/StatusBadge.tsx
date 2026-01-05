'use client';

import { SignalStatus, ConfidenceLevel } from '@/types';
import { getStatusColor, getStatusBgColor, getConfidenceColor } from '@/lib/utils';

interface StatusBadgeProps {
  status: SignalStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(
        status
      )} ${getStatusBgColor(status)}`}
    >
      {label}
    </span>
  );
}

interface ConfidenceBadgeProps {
  confidence: ConfidenceLevel;
}

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  return (
    <span className={`text-xs ${getConfidenceColor(confidence)}`}>
      {confidence.toUpperCase()} confidence
    </span>
  );
}

