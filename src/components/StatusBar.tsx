// src/components/StatusBar.tsx
import React, { useEffect, useRef, useState } from "react";

interface StatusBarProps {
  open: boolean;
  message: string;
  isError?: boolean;
  duration?: number;
  onClose: () => void;
  position?:
  | "top-left"
  | "top-center"
  | "top-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";
}

// maps position → Tailwind container classes
const positionClasses: Record<string, string> = {
  "top-left": "top-6 left-6 justify-start",
  "top-center": "top-6 inset-x-0 justify-center",
  "top-right": "top-6 right-6 justify-end",

  "bottom-left": "bottom-6 left-6 justify-start",
  "bottom-center": "bottom-6 inset-x-0 justify-center",
  "bottom-right": "bottom-6 right-6 justify-end",
};

const StatusBar: React.FC<StatusBarProps> = ({
  open,
  message,
  isError = false,
  duration = 3000,
  onClose,
  position = "top-right",
}) => {
  const [visible, setVisible] = useState(open);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setVisible(open);
  }, [open]);

  useEffect(() => {
    if (!visible || duration <= 0) return;

    timerRef.current = window.setTimeout(() => {
      setVisible(false);
      setTimeout(onClose, 200);
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, duration, onClose]);

  useEffect(() => {
    if (!open && visible) {
      setVisible(false);
      const t = window.setTimeout(onClose, 200);
      return () => clearTimeout(t);
    }
  }, [open, visible, onClose]);

  if (!open && !visible) return null;

  return (
    <div
      className={[
        "pointer-events-none fixed z-[9999] flex px-4",
        "inset-x-0", // ensures centering works
        positionClasses[position] ?? positionClasses["bottom-center"],
      ].join(" ")}
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={[
          "pointer-events-auto max-w-sm w-full rounded-lg border px-4 py-2 shadow-lg transform transition-all duration-200",
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
          isError
            ? "bg-amber-900/95 border-amber-700 text-amber-100"
            : "bg-slate-900/95 border-slate-700 text-slate-200",
        ].join(" ")}
        role="status"
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {isError ? (
              <svg
                className="h-5 w-5 text-amber-300"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.75a.75.75 0 10-1.5 0v4.5a.75.75 0 001.5 0v-4.5zM10 14.25a.9.9 0 100-1.8.9.9 0 000 1.8z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 text-emerald-300"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M16.707 5.293a1 1 0 00-1.414 0L9 11.586 6.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l7-7a1 1 0 000-1.414z" />
              </svg>
            )}
          </div>

          <div className="min-w-0 flex-1 text-sm">{message}</div>

          <button
            onClick={() => {
              setVisible(false);
              setTimeout(onClose, 200);
            }}
            className={[
              "rounded-md px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1",
              isError
                ? "text-amber-200 hover:bg-amber-800/30 focus:ring-amber-500"
                : "text-slate-200 hover:bg-slate-800/40 focus:ring-emerald-500",
            ].join(" ")}
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(StatusBar);
