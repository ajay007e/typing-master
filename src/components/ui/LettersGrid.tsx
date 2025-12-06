// src/components/ui/LettersGrid.tsx
import React from "react";

interface Props {
  letters: string[];
  selected: Set<string>;
  onToggleLetter: (ch: string) => void;
}

const LettersGrid: React.FC<Props> = ({
  letters,
  selected,
  onToggleLetter,
}) => {
  return (
    <div className="grid grid-cols-8 gap-2">
      {letters.map((ch) => (
        <button
          key={ch}
          type="button"
          onClick={() => onToggleLetter(ch)}
          className={[
            "rounded-md px-2 py-1 text-base transition",
            selected.has(ch)
              ? "bg-emerald-600 text-black"
              : "bg-slate-900 text-slate-200 hover:bg-slate-800",
          ].join(" ")}
        >
          {ch}
        </button>
      ))}
    </div>
  );
};

export default React.memo(LettersGrid);
