import React from "react";
import { PiGear, PiSlidersHorizontal } from "react-icons/pi";

interface ModeHeaderProps {
  appName: string;
  selectedModeLabel?: string;
  onSelectedModeClick?: () => void;
  onOpenSettings: () => void;
  onOpenConfig?: () => void;
}

const ModeHeader: React.FC<ModeHeaderProps> = ({
  appName,
  selectedModeLabel,
  onSelectedModeClick,
  onOpenSettings,
  onOpenConfig,
}) => {
  return (
    <header className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
      {/* Left: app name */}
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-50">
          {appName}
        </h1>
        <span className="text-[11px] text-slate-400">
          Malayalam typing practice
        </span>
      </div>

      {/* Right: mode label + config + settings */}
      <div className="flex items-center gap-2">
        {selectedModeLabel && (
          <button
            type="button"
            onClick={onSelectedModeClick}
            className="rounded-full px-3 py-1 text-xs font-medium text-slate-600 underline-offset-4 hover:bg-slate-100 hover:text-slate-900 hover:underline dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
          >
            {selectedModeLabel}
          </button>
        )}

        {onOpenConfig && (
          <button
            type="button"
            onClick={onOpenConfig}
            className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-800"
          >
            <PiSlidersHorizontal className="text-sm" />
            <span>Configure</span>
          </button>
        )}

        <button
          type="button"
          onClick={onOpenSettings}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:bg-slate-800"
          aria-label="Open settings"
        >
          <PiGear className="text-lg" />
        </button>
      </div>
    </header>
  );
};

export default ModeHeader;
