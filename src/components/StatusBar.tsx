// src/components/StatusBar.tsx
import React from "react";

interface StatusBarProps {
  message: string;
  isError: boolean;
}

const StatusBar: React.FC<StatusBarProps> = ({ message, isError }) => (
  <div
    className={[
      "mt-3 text-xs",
      isError ? "text-amber-400" : "text-slate-400",
    ].join(" ")}
  >
    {message}
  </div>
);

export default React.memo(StatusBar);
