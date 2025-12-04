import React, { useEffect, useRef } from "react";
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
  fontFamily: string; // "default" | "anek" | "chilanka" | "manjari"
  fontSize: string; // "text-base" | "text-lg" | "text-xl" | ...
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
  fontFamily,
  fontSize,
}) => {
  // Inner scrolling window (3-line viewport)
  const containerRef = useRef<HTMLDivElement | null>(null);
  // Active character span
  const activeCharRef = useRef<HTMLSpanElement | null>(null);

  // Auto-scroll: keep active line in the middle of the 3-line window
  useEffect(() => {
    const container = containerRef.current;
    const active = activeCharRef.current;
    if (!container) return;

    // Before running / after reset, always show from top
    if (stage !== "running" && stage !== "finished") {
      container.scrollTop = 0;
      return;
    }

    if (!active) return;

    const cRect = container.getBoundingClientRect();
    const aRect = active.getBoundingClientRect();

    const currentTop = container.scrollTop;
    const offsetTop = aRect.top - cRect.top + currentTop; // char top in scrollable content

    // Window is exactly 3 lines high → line height ≈ 1/3 of height
    const lineHeightPx = container.clientHeight / 3;

    // We want the active line around the middle: its top ≈ one line from top
    let targetScrollTop = offsetTop - lineHeightPx;

    // Clamp scrolling
    const maxScroll = container.scrollHeight - container.clientHeight;
    if (targetScrollTop < 0) targetScrollTop = 0;
    if (targetScrollTop > maxScroll) targetScrollTop = maxScroll;

    container.scrollTop = targetScrollTop;
  }, [currentCharIndex, stage]);

  // Block wheel / touch scroll from user (only our code moves the window)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const preventScroll = (e: Event) => {
      e.preventDefault();
    };

    el.addEventListener("wheel", preventScroll, { passive: false });
    el.addEventListener("touchmove", preventScroll, { passive: false });

    return () => {
      el.removeEventListener("wheel", preventScroll);
      el.removeEventListener("touchmove", preventScroll);
    };
  }, []);

  return (
    <div className="mt-6 relative">
      {/* Outer box: padding + border + background */}
      <div
        className="w-[50vw] rounded-2xl border border-slate-800 bg-slate-950 px-4 py-4"
        onClick={onAreaClick}
      >
        {/* Inner window: exactly 3 lines high, no padding */}
        <div
          ref={containerRef}
          className={[
            "typing-window whitespace-pre-wrap break-words", // defined in CSS
            fontSize,
            fontFamily === "default" && "font-ml-nsm",
            fontFamily === "anek" && "font-ml-am",
            fontFamily === "chilanka" && "font-ml-c",
            fontFamily === "manjari" && "font-ml-m",
            !currentText &&
            "text-sm text-slate-500 flex items-center justify-center",
          ]
            .filter(Boolean)
            .join(" ")}
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
                const chunk = typedChunks[idx] ?? "";

                const chunkVisible = chunk.split(PLACEHOLDER).join("");

                const normTarget = normalizeMalayalam(targetChar);
                const normTyped = normalizeMalayalam(chunkVisible);

                const isComplete = chunk.length === strokesNeeded;

                let cls = "whitespace-pre";
                const isActive = idx === currentCharIndex;

                if (stage === "prestart") {
                  if (idx > 0)
                    cls += " text-transparent bg-slate-900 rounded";
                } else if (stage === "running") {
                  if (idx < currentCharIndex) {
                    if (isComplete && normTyped === normTarget) {
                      cls += " text-emerald-400";
                    } else {
                      cls += " text-red-400 underline";
                    }
                  } else if (isActive) {
                    if (!isComplete) {
                      cls +=
                        " text-slate-50 relative after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-full after:bg-slate-100 after:animate-pulse";
                    } else {
                      if (normTyped === normTarget) {
                        cls += " text-emerald-400";
                      } else {
                        cls += " text-red-400 underline";
                      }
                    }
                  }
                } else if (stage === "finished") {
                  if (isComplete && normTyped === normTarget) {
                    cls += " text-emerald-400";
                  } else {
                    cls += " text-red-400 underline";
                  }
                }

                return (
                  <span
                    key={idx}
                    className={cls}
                    ref={isActive ? activeCharRef : undefined}
                  >
                    {targetChar}
                  </span>
                );
              });
            })()}
        </div>
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
