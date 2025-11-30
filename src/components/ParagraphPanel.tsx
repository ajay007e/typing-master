import React from "react";

interface ParagraphPanelProps {
  text: string;
  onChange: (value: string) => void;
}

const ParagraphPanel: React.FC<ParagraphPanelProps> = ({ text, onChange }) => {
  return (
    <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
      <div className="mb-2 text-xs font-semibold text-slate-200">
        Custom text
      </div>

      <textarea
        className="w-full min-h-[84px] resize-y rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        placeholder="Paste or type Malayalam text here..."
        value={text}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default ParagraphPanel;
