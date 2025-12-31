'use client';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="border border-red-900/50 bg-red-950/20 p-4 text-center">
      <pre className="text-red-500/80 text-xs mb-3">
{`
  ╭─ ERROR ─────────────────╮
  │                         │
  │   ⚠ CONNECTION FAILED   │
  │                         │
  ╰─────────────────────────╯
`}
      </pre>
      <p className="text-red-400/80 text-xs mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3 py-1 border border-zinc-700 text-zinc-400 text-xs hover:border-zinc-600 hover:text-zinc-300 transition-colors"
        >
          [RETRY]
        </button>
      )}
    </div>
  );
}
