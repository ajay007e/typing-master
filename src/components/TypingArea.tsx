import React from "react";
import type { Stage } from "../utils/types";
import type { GraphemeInfo } from "../utils/typingModel";
import { PLACEHOLDER } from "../utils/typingModel";
import { normalizeMalayalam } from "../utils/malayalam";

interface TypingAreaProps {
  currentText: string;
  typedText: string;
  stage: Stage;
  hiddenInputRef: React.RefObject<HTMLTextAreaElement | null>;
  onHiddenInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onHiddenKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onAreaClick: () => void;
  graphemeInfos: GraphemeInfo[];
  currentCharIndex: number;
}

const TypingArea: React.FC<TypingAreaProps> = ({
  currentText,
  typedText,
  stage,
  hiddenInputRef,
  onHiddenInputChange,
  onHiddenKeyDown,
  onAreaClick,
  graphemeInfos,
  currentCharIndex,
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
          : (() => {
            const targetGraphemes = graphemeInfos.map((g) => g.grapheme);

            const typedChunks: string[] = [];
            let pos = 0;
            for (let i = 0; i < graphemeInfos.length; i++) {
              const strokesNeeded = graphemeInfos[i].keystrokes.length || 1;
              const end = Math.min(typedText.length, pos + strokesNeeded);
              typedChunks.push(typedText.slice(pos, end));
              pos += strokesNeeded;
            }

            return targetGraphemes.map((ch, idx) => {
              const targetChar = ch;
              const strokesNeeded =
                graphemeInfos[idx]?.keystrokes.length || 1;
              const chunk = typedChunks[idx] ?? ""; // raw typed chars (may include PLACEHOLDER)

              // strip placeholders for logical comparison
              const chunkVisible = chunk.split(PLACEHOLDER).join("");

              const normTarget = normalizeMalayalam(targetChar);
              const normTyped = normalizeMalayalam(chunkVisible);

              const isComplete = chunk.length === strokesNeeded;

              let cls = "whitespace-pre";

              if (stage === "prestart") {
                if (idx > 0) cls += " text-transparent bg-slate-900 rounded";
              } else if (stage === "running") {
                if (idx < currentCharIndex) {
                  // Already moved past this grapheme → finished
                  if (isComplete && normTyped === normTarget) {
                    cls += " text-emerald-400";
                  } else {
                    cls += " text-red-400 underline";
                  }
                } else if (idx === currentCharIndex) {
                  // Active grapheme
                  if (!isComplete) {
                    // Still consuming keystrokes → white with caret underline
                    cls +=
                      " text-slate-50 relative after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-full after:bg-slate-100 after:animate-pulse";
                  } else {
                    // Just completed, but cursor didn't move yet (edge case)
                    if (normTyped === normTarget) {
                      cls += " text-emerald-400";
                    } else {
                      cls += " text-red-400 underline";
                    }
                  }
                } else {
                  // Future graphemes: default style
                }
              } else if (stage === "finished") {
                if (isComplete && normTyped === normTarget) {
                  cls += " text-emerald-400";
                } else {
                  cls += " text-red-400 underline";
                }
              }

              return (
                <span key={idx} className={cls}>
                  {targetChar}
                </span>
              );
            });
          })()}
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
        onKeyDown={onHiddenKeyDown}
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
