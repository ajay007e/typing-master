import React from "react";
import type { AppConfig } from "../types";
import lettersConfig from "../config/letters.json";

interface LetterPanelProps {
  letters: string[];
  selectedLetters: string[];
  configLetters: AppConfig["letters"];
  onToggleLetter: (ch: string) => void;
  onLenOptionChange: (value: AppConfig["letters"]["lenOption"]) => void;
  onLenCustomChange: (value: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
}

type LettersConfig = {
  vowels: string[];
  consonantGroups: { id: string; label: string; letters: string[] }[];
  specialConsonants: string[];
};

const {
  vowels: cfgVowels,
  consonantGroups,
  specialConsonants,
} = lettersConfig as LettersConfig;

const LetterPanel: React.FC<LetterPanelProps> = ({
  letters,
  selectedLetters,
  configLetters,
  onToggleLetter,
  onLenOptionChange,
  onLenCustomChange,
  onSelectAll,
  onClear,
}) => {
  // Only show letters that actually exist in the current letters prop
  const letterSet = new Set(letters);

  const vowels = cfgVowels.filter((ch) => letterSet.has(ch));
  const specials = specialConsonants.filter((ch) => letterSet.has(ch));

  const renderLetterButton = (ch: string) => {
    const selected = selectedLetters.includes(ch);
    return (
      <button
        key={ch}
        type="button"
        onClick={() => onToggleLetter(ch)}
        className={[
          "rounded-md px-2 py-1 text-base transition",
          selected
            ? "bg-emerald-600 text-black"
            : "bg-slate-900 text-slate-200 hover:bg-slate-800",
        ].join(" ")}
      >
        {ch}
      </button>
    );
  };

  const renderGroup = (title: string, groupLetters: string[]) => {
    const filtered = groupLetters.filter((ch) => letterSet.has(ch));
    if (!filtered.length) return null;

    return (
      <div className="mt-2">
        <div className="mb-1 text-[10px] uppercase tracking-wide text-slate-500">
          {title}
        </div>
        <div className="flex flex-wrap gap-1">
          {filtered.map(renderLetterButton)}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
      {/* Header row */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-slate-200">Letter set</h2>
        <div className="flex gap-2 text-xs text-slate-400">
          <button
            type="button"
            onClick={onSelectAll}
            className="hover:text-slate-200"
          >
            All
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={onClear}
            className="hover:text-slate-200"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Vowels */}
      {renderGroup("Vowels", vowels)}

      {/* Consonant sound groups */}
      {consonantGroups.map((group) => renderGroup(group.label, group.letters))}

      {/* Special consonants */}
      {renderGroup("Special consonants", specials)}

      {/* Footer / length controls */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800 pt-2 text-xs">
        <div className="flex items-center gap-1">
          <span className="text-slate-400">Length</span>
          {["50", "100", "200"].map((val) => (
            <button
              key={val}
              type="button"
              onClick={() =>
                onLenOptionChange(val as AppConfig["letters"]["lenOption"])
              }
              className={[
                "rounded-full px-2 py-0.5",
                configLetters.lenOption === val
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
              configLetters.lenOption === "custom"
                ? "bg-emerald-500 text-black"
                : "bg-slate-900 text-slate-300 hover:bg-slate-800",
            ].join(" ")}
          >
            Custom
          </button>

          {configLetters.lenOption === "custom" && (
            <input
              type="number"
              min={10}
              max={1000}
              value={configLetters.customLength}
              onChange={(e) => onLenCustomChange(e.target.value)}
              className="ml-1 w-16 rounded-full border border-slate-700 bg-slate-950 px-2 py-0.5 text-xs"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default LetterPanel;
