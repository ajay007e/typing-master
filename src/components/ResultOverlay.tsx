// src/components/ResultOverlay.tsx
import React from "react";
import type { TypingMetrics } from "../utils/metrics";
import type { ProgressMode } from "../utils/types";

interface ResultOverlayProps {
  show: boolean;
  stats: TypingMetrics | null;
  onRepeat: () => void;
  modeName: string;
  modeProgress?: ProgressMode;
}

const prettyModeName = (modeName: string) => {
  switch (modeName) {
    case "letters":
      return "Letter practice";
    case "paragraph":
      return "Custom paragraph";
    case "common":
      return "Common words paragraph";
    case "course":
      return "Course lesson";
    default:
      return modeName;
  }
};

const ResultOverlay: React.FC<ResultOverlayProps> = ({
  show,
  stats,
  onRepeat,
  modeName,
  modeProgress,
}) => {
  if (!show || !stats) return null;

  const durationSec = (stats.durationMs / 1000).toFixed(1);
  const bestLine = modeProgress
    ? `Best in ${prettyModeName(modeName)}: ${(
      modeProgress.bestWpm ?? 0
    ).toFixed(1)} WPM, ${(modeProgress.bestAcc ?? 0).toFixed(0)}% accuracy`
    : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-950/95 px-5 py-5 text-center shadow-2xl">
        {/* Mode badge */}
        <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
          <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
            {prettyModeName(modeName)}
          </span>
          {bestLine && (
            <span className="text-[10px] text-slate-500">Progress saved</span>
          )}
        </div>

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

        {/* Best in this mode */}
        {bestLine && (
          <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-left text-[11px] text-slate-300">
            <div className="text-[10px] uppercase tracking-wide text-slate-400">
              Best in this mode
            </div>
            <div className="mt-1 text-[11px] text-slate-100">
              {(modeProgress?.bestWpm ?? 0).toFixed(1)} WPM ·{" "}
              {(modeProgress?.bestAcc ?? 0).toFixed(0)}% accuracy ·{" "}
              {modeProgress?.runs ?? 0} run
              {(modeProgress?.runs ?? 0) === 1 ? "" : "s"}
            </div>
          </div>
        )}

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
