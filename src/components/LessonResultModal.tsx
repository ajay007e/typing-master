// src/components/LessonResultModal.tsx
import React from "react";
import type { TypingMetrics } from "../utils/metrics";

interface LessonResultModalProps {
  open: boolean;
  onClose: () => void;
  stats: TypingMetrics;
  score: number;
  parts: {
    wpmScore: number;
    rawScore: number;
    accScore: number;
    completenessScore: number;
    missing: number;
  };
  canAdvance: boolean;
  onAdvance: () => void;
  onRetry: () => void;
  onReview: () => void;
}

const StatTile: React.FC<{
  title: string;
  value: React.ReactNode;
  small?: string;
}> = ({ title, value, small }) => (
  <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-left">
    <div className="text-[11px] text-slate-400">{title}</div>
    <div className="mt-1 text-lg font-semibold text-slate-50">{value}</div>
    {small && <div className="mt-0.5 text-[11px] text-slate-500">{small}</div>}
  </div>
);

const LessonResultModal: React.FC<LessonResultModalProps> = ({
  open,
  onClose,
  stats,
  score,
  parts,
  canAdvance,
  onAdvance,
  onRetry,
  onReview,
}) => {
  if (!open) return null;

  const badgeColor = canAdvance
    ? "bg-emerald-500 text-slate-900"
    : "bg-amber-500 text-slate-900";

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-950/95 px-6 py-5 text-slate-100 shadow-2xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs text-slate-400">Lesson Result</div>
            <h2 className="mt-2 text-2xl font-semibold">Score</h2>
            <div className="mt-3 flex items-center gap-3">
              <div
                className={`inline-flex items-center justify-center ${badgeColor} text-xl font-bold rounded-full h-16 w-16`}
              >
                {score}
              </div>
              <div>
                <div className="text-sm font-medium">
                  {canAdvance ? "Ready to advance" : "Needs improvement"}
                </div>
                <div className="mt-1 text-[13px] text-slate-400">
                  Based on WPM, raw WPM, accuracy and missing strokes
                </div>
              </div>
            </div>
          </div>

          <div className="ml-auto flex gap-2">
            <button
              onClick={onClose}
              className="rounded-md px-3 py-1 text-xs border border-slate-700 bg-slate-900/60"
            >
              Close
            </button>
          </div>
        </div>

        {/* Breakdown */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <StatTile
            title="WPM"
            value={`${stats.wpm.toFixed(1)} wpm`}
            small={`score ${parts.wpmScore}`}
          />
          <StatTile
            title="Raw WPM"
            value={`${stats.rawWpm.toFixed(1)} wpm`}
            small={`score ${parts.rawScore}`}
          />
          <StatTile
            title="Accuracy"
            value={`${stats.accuracy.toFixed(0)}%`}
            small={`score ${parts.accScore}`}
          />
          <StatTile
            title="Missing"
            value={`${parts.missing}`}
            small={`completeness ${parts.completenessScore}`}
          />
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="text-[11px] text-slate-400 mb-1">Overall score</div>
          <div className="rounded-full bg-slate-800 h-3">
            <div
              className={`h-3 rounded-full ${canAdvance ? "bg-emerald-400" : "bg-amber-400"}`}
              style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={onRetry}
            className="rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm font-semibold hover:bg-slate-800"
          >
            Practice again
          </button>

          <button
            onClick={onReview}
            className="rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm font-semibold hover:bg-slate-800"
          >
            Review strokes
          </button>

          <div className="ml-auto">
            <button
              onClick={onAdvance}
              disabled={!canAdvance}
              className={[
                "rounded-full px-4 py-2 text-sm font-semibold",
                canAdvance
                  ? "bg-emerald-500 text-slate-900 hover:bg-emerald-400"
                  : "bg-slate-700 text-slate-400 cursor-not-allowed",
              ].join(" ")}
            >
              Advance
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(LessonResultModal);
