import React from "react";
import type { AppConfig } from "../utils/types";

interface ModeHeaderProps {
  mode: AppConfig["mode"];
  onModeChange: (mode: AppConfig["mode"]) => void;
  onStart: () => void;
  showKeyboard: boolean;
  onToggleKeyboard: (value: boolean) => void;
  allowBackspace: boolean;
  onToggleBackspace: (value: boolean) => void;
}

const ModeHeader: React.FC<ModeHeaderProps> = ({
  mode,
  onModeChange,
  onStart,
  showKeyboard,
  onToggleKeyboard,
  allowBackspace,
  onToggleBackspace,
}) => {
  return (
    <header className="border-b border-slate-800 pb-3 mb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: title + subtle helper text */}
        <div className="min-w-[200px]">
          <h1 className="text-lg font-semibold text-slate-50">
            Malayalam Typing
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Press <span className="font-medium text-slate-200">Esc</span> to
            reset.
          </p>
        </div>

        {/* Right: controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Mode select */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Mode</span>
            <select
              className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              value={mode}
              onChange={(e) =>
                onModeChange(e.target.value as AppConfig["mode"])
              }
            >
              <option value="letters">Letters</option>
              <option value="paragraph">Paragraph</option>
              <option value="common">Common words</option>
              <option value="course">Course</option>
            </select>
          </div>

          {/* Keyboard toggle – minimal switch style */}
          <button
            type="button"
            onClick={() => onToggleKeyboard(!showKeyboard)}
            className="flex items-center gap-2 text-xs text-slate-300"
          >
            <span className="text-slate-400">Keyboard</span>
            <span
              className={[
                "inline-flex h-4 w-7 items-center rounded-full border border-slate-600 px-[2px] transition-colors",
                showKeyboard
                  ? "bg-emerald-500/90 border-emerald-400"
                  : "bg-slate-900",
              ].join(" ")}
            >
              <span
                className={[
                  "h-3 w-3 rounded-full bg-slate-900 shadow-sm transition-transform",
                  showKeyboard ? "translate-x-3" : "translate-x-0",
                ].join(" ")}
              />
            </span>
          </button>
          {/* Backspace toggle */}
          <button
            type="button"
            onClick={() => onToggleBackspace(!allowBackspace)}
            className="flex items-center gap-2 text-xs text-slate-300"
          >
            <span className="text-slate-400">Backspace</span>
            <span
              className={[
                "inline-flex h-4 w-7 items-center rounded-full border border-slate-600 px-[2px] transition-colors",
                allowBackspace
                  ? "bg-emerald-500/90 border-emerald-400"
                  : "bg-slate-900",
              ].join(" ")}
            >
              <span
                className={[
                  "h-3 w-3 rounded-full bg-slate-900 shadow-sm transition-transform",
                  allowBackspace ? "translate-x-3" : "translate-x-0",
                ].join(" ")}
              />
            </span>
          </button>
          {/* Start button */}
          <button
            onClick={onStart}
            className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            Generate text
          </button>
        </div>
      </div>
    </header>
  );
};

export default ModeHeader;
