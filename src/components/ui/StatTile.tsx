// src/components/ui/StatTile.tsx
import React from "react";

interface Props {
  title: string;
  value: React.ReactNode;
  small?: string;
}

const StatTile: React.FC<Props> = ({ title, value, small }) => (
  <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-left">
    <div className="text-[11px] text-slate-400">{title}</div>
    <div className="mt-1 text-lg font-semibold text-slate-50">{value}</div>
    {small && <div className="mt-0.5 text-[11px] text-slate-500">{small}</div>}
  </div>
);

export default React.memo(StatTile);
