import React from "react";
import type { Stage } from "../utils/types";

interface TypingAreaProps {
  currentText: string;
  typedText: string;
  stage: Stage;
  hiddenInputRef: React.RefObject<HTMLTextAreaElement>;
  onHiddenInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onAreaClick: () => void;
}

const TypingArea: React.FC<TypingAreaProps> = ({
  currentText,
  typedText,
  stage,
  hiddenInputRef,
  onHiddenInputChange,
  onAreaClick,
}) => {
  return (
    <div className="mt-6 relative">
      <div
        className={[
          "min-h-[120px] max-h-[60vh] overflow-y-auto rounded-2xl border border-slate-800 bg-slate-950 px-4 py-4 text-lg leading-8",
          "whitespace-pre-wrap break-words",
          !currentText &&
          "text-sm text-slate-500 flex items-center justify-center",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={onAreaClick}
      >
        {!currentText
          ? "No text loaded. Generate text to begin."
          : currentText.split("").map((ch, idx) => {
            const targetChar = ch;
            const typedChar = typedText[idx];
            let cls = "whitespace-pre";

            if (stage === "prestart") {
              if (idx > 0) cls += " text-transparent bg-slate-900 rounded";
            } else if (stage === "running") {
              if (typedChar != null) {
                cls +=
                  typedChar === targetChar
                    ? " text-emerald-400"
                    : " text-red-400 underline";
              } else if (idx === typedText.length) {
                cls +=
                  " relative after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-full after:bg-slate-100 after:animate-pulse";
              }
            } else if (stage === "finished") {
              if (typedChar != null) {
                cls +=
                  typedChar === targetChar
                    ? " text-emerald-400"
                    : " text-red-400 underline";
              }
            }

            return (
              <span key={idx} className={cls}>
                {ch}
              </span>
            );
          })}
      </div>

      {/* hidden input */}
      <textarea
        ref={hiddenInputRef}
        className="pointer-events-none absolute h-0 w-0 opacity-0"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        onChange={onHiddenInputChange}
      />

      {/* prestart overlay */}
      {stage === "prestart" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full border border-slate-700 bg-slate-900/95 px-4 py-2 text-xs text-slate-100">
            Press <span className="font-semibold text-indigo-300">any key</span>{" "}
            to begin the test • Press{" "}
            <span className="font-semibold text-indigo-300">Esc</span> to go
            back
          </div>
        </div>
      )}
    </div>
  );
};

export default TypingArea;
