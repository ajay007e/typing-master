import React from "react";
import type { TypingMetrics } from "../utils/metrics";

interface ResultOverlayProps {
  show: boolean;
  stats: TypingMetrics | null;
  onRepeat: () => void;
}

const ResultOverlay: React.FC<ResultOverlayProps> = ({
  show,
  stats,
  onRepeat,
}) => {
  if (!show || !stats) return null;

  const durationSec = (stats.durationMs / 1000).toFixed(1);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-950/95 px-5 py-5 text-center shadow-2xl">
        <h2 className="text-base font-semibold text-slate-50">
          Test completed
        </h2>

        {/* Main WPM */}
        <div className="mt-3">
          <div className="text-[11px] uppercase tracking-wide text-slate-400">
            WPM
          </div>
          <div className="mt-1 text-4xl font-semibold text-emerald-400">
            {stats.wpm.toFixed(1)}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {durationSec}s · {stats.accuracy.toFixed(0)}% accuracy
          </div>
        </div>

        {/* Secondary metrics */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-2">
            <div className="text-[10px] text-slate-400">Raw WPM</div>
            <div className="mt-1 text-sm font-medium text-slate-100">
              {stats.rawWpm.toFixed(1)}
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-2">
            <div className="text-[10px] text-slate-400">Correct</div>
            <div className="mt-1 text-sm font-medium text-emerald-300">
              {stats.correct}
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-2">
            <div className="text-[10px] text-slate-400">Errors</div>
            <div className="mt-1 text-sm font-medium text-rose-300">
              {stats.incorrect + stats.extra + stats.missed}
            </div>
          </div>
        </div>

        {/* Detailed breakdown */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-400">
          <div className="flex justify-between">
            <span>Incorrect</span>
            <span>{stats.incorrect}</span>
          </div>
          <div className="flex justify-between">
            <span>Extra</span>
            <span>{stats.extra}</span>
          </div>
          <div className="flex justify-between">
            <span>Missed</span>
            <span>{stats.missed}</span>
          </div>
          <div className="flex justify-between">
            <span>Total typed</span>
            <span>{stats.totalTyped}</span>
          </div>
        </div>

        {/* Actions */}
        <button
          type="button"
          onClick={onRepeat}
          className="mt-4 w-full rounded-full bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        >
          Generate new text with same settings
        </button>
        <div className="mt-2 text-[10px] text-slate-500">
          Press <span className="font-medium text-slate-300">Esc</span> to go
          back to settings.
        </div>
      </div>
    </div>
  );
};

export default ResultOverlay;
