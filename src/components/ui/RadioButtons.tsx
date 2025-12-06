// src/components/ui/RadioButtons.tsx
import React from "react";

interface Props {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}

const RadioButtons: React.FC<Props> = ({ options, value, onChange }) => (
  <div className="flex items-center gap-2">
    {options.map((val) => (
      <button
        key={val}
        onClick={() => onChange(val)}
        className={[
          "rounded-full px-2 py-0.5",
          value === val
            ? "bg-emerald-500 text-black"
            : "bg-slate-900 text-slate-300 hover:bg-slate-800",
        ].join(" ")}
      >
        {val}
      </button>
    ))}
  </div>
);

export default React.memo(RadioButtons);
