import React from "react";
import type { AppConfig } from "../utils/types";

interface CommonWordsPanelProps {
  commonConfig: AppConfig["common"];
  onLenOptionChange: (value: AppConfig["common"]["lenOption"]) => void;
  onCustomChange: (value: string) => void;
}

const CommonWordsPanel: React.FC<CommonWordsPanelProps> = ({
  commonConfig,
  onLenOptionChange,
  onCustomChange,
}) => {
  return (
    <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
      <div className="mb-0.5 text-xs font-semibold text-slate-200">
        Common words
      </div>

      {/* Tiny description */}
      <div className="mb-2 text-[11px] text-slate-400">
        Random paragraph generated from frequent Malayalam words.
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-slate-400">Words</span>

        {["30", "60", "120"].map((val) => (
          <button
            key={val}
            type="button"
            onClick={() =>
              onLenOptionChange(val as AppConfig["common"]["lenOption"])
            }
            className={[
              "rounded-full px-2 py-0.5",
              commonConfig.lenOption === val
                ? "bg-emerald-500 text-black"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800",
            ].join(" ")}
          >
            {val}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onLenOptionChange("custom")}
          className={[
            "rounded-full px-2 py-0.5",
            commonConfig.lenOption === "custom"
              ? "bg-emerald-500 text-black"
              : "bg-slate-900 text-slate-300 hover:bg-slate-800",
          ].join(" ")}
        >
          Custom
        </button>

        {commonConfig.lenOption === "custom" && (
          <input
            type="number"
            min={10}
            max={500}
            value={commonConfig.customLength}
            onChange={(e) => onCustomChange(e.target.value)}
            className="w-16 rounded-full border border-slate-700 bg-slate-950 px-2 py-0.5 text-xs"
          />
        )}
      </div>
    </div>
  );
};

export default CommonWordsPanel;
