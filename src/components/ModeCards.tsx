import React from "react";
import type { AppConfig } from "../utils/types";
import {
  PiKeyboard,
  PiFileText,
  PiChartBar,
  PiGraduationCap,
} from "react-icons/pi";

interface ModeMeta {
  id: AppConfig["mode"];
  label: string;
  description: string;
  icon: "keyboard" | "document" | "stats" | "graduation";
}

interface ModeCardsProps {
  modes: ModeMeta[];
  selectedModeId: AppConfig["mode"];
  onSelectMode: (id: AppConfig["mode"]) => void;
}

const ICON_MAP = {
  keyboard: PiKeyboard,
  document: PiFileText,
  stats: PiChartBar,
  graduation: PiGraduationCap,
};

const ModeCards: React.FC<ModeCardsProps> = ({
  modes,
  selectedModeId,
  onSelectMode,
}) => {
  return (
    <section>
      <div className="mb-4 text-xs text-slate-500">
        Choose a mode to start practicing.
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {modes.map((mode) => {
          const Icon = ICON_MAP[mode.icon];
          const isActive = mode.id === selectedModeId;

          return (
            <button
              key={mode.id}
              onClick={() => onSelectMode(mode.id)}
              className={[
                "group relative flex w-full max-w-[11rem] flex-col rounded-2xl border px-3 py-3 text-left transition",
                "focus-visible:ring-2 focus-visible:ring-emerald-500",
                isActive
                  ? "border-emerald-400 bg-emerald-50/70 dark:bg-emerald-500/10"
                  : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800",
              ].join(" ")}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                  <Icon className="text-lg text-slate-700 dark:text-slate-200" />
                </span>
                <span className="text-xs font-semibold">{mode.label}</span>
              </div>

              <p className="mt-2 text-[11px] text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300">
                {mode.description}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default ModeCards;
