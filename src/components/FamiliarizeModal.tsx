import React, { useEffect, useRef, useState } from "react";

interface FamiliarizeModalProps {
  open: boolean;
  onClose: () => void;
  lessonTitle: string;
  keys: string[]; // graphemes or key labels
  onStartLesson: () => void; // called when user wants to begin main practice
}

const KeyTile: React.FC<{ k: string; active?: boolean; done?: boolean }> = ({
  k,
  active,
  done,
}) => (
  <div
    className={[
      "rounded-md px-3 py-2 text-center text-lg font-medium",
      done
        ? "bg-emerald-600 text-black"
        : active
          ? "bg-emerald-500 text-black"
          : "bg-slate-900 text-slate-200",
    ].join(" ")}
  >
    {k}
  </div>
);

const FamiliarizeModal: React.FC<FamiliarizeModalProps> = ({
  open,
  onClose,
  lessonTitle,
  keys,
  onStartLesson,
}) => {
  const [mode, setMode] = useState<"idle" | "drill" | "done">("idle");
  const [seqIdx, setSeqIdx] = useState(0);
  const [shuffled, setShuffled] = useState<string[]>([]);
  const hiddenRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!open) {
      setMode("idle");
      setSeqIdx(0);
      setShuffled([]);
      return;
    }
    // default shuffle for drill: repeat keys several times for practice
    const seed = [...keys];
    // repeat 2 times for a short drill
    const arr: string[] = [];
    for (let r = 0; r < 2; r++) {
      for (const k of seed) arr.push(k);
    }
    setShuffled(arr);
    setSeqIdx(0);
    setMode("idle");
  }, [open, keys]);

  useEffect(() => {
    if (mode === "drill" && hiddenRef.current) {
      // focus hidden input to capture keystrokes
      hiddenRef.current.value = "";
      hiddenRef.current.focus();
    }
  }, [mode]);

  // capture user key presses for the drill
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (mode !== "drill") return;
    const key = e.key;
    // we compare by grapheme; the user's physical key may produce the grapheme directly
    // For robustness, match by the first character of input or key
    // If the user types using Malayalam layout, e.key gives the char
    const expected = shuffled[seqIdx];
    if (!expected) return;
    // Accept direct match
    if (key === expected) {
      setSeqIdx((s) => s + 1);
      if (seqIdx + 1 >= shuffled.length) {
        setMode("done");
      }
    } else {
      // not matching — optionally flash error; do nothing
    }
  }

  const startDrill = () => {
    setMode("drill");
    setSeqIdx(0);
    setTimeout(() => {
      hiddenRef.current?.focus();
    }, 20);
  };

  const skip = () => {
    setMode("done");
  };

  const startLesson = () => {
    onStartLesson();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-950/95 px-6 py-5 text-slate-100">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">
              Pre-lesson: Familiarize
            </div>
            <h3 className="mt-1 text-lg font-semibold">{lessonTitle}</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-900/50"
          >
            Close
          </button>
        </div>

        <div className="mt-4">
          <div className="text-xs text-slate-400 mb-2">
            Keys / Graphemes in this lesson
          </div>
          <div className="grid grid-cols-6 gap-2">
            {keys.map((k) => (
              <div key={k} className="flex items-center justify-center">
                <KeyTile k={k} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 border-t border-slate-800 pt-4">
          <div className="text-xs text-slate-400">Drill</div>
          <div className="mt-2 text-[13px] text-slate-300">
            A short guided drill to practise the keys. Press the shown keys in
            sequence.
          </div>

          <div className="mt-3">
            <div className="mb-2 text-[12px] text-slate-400">Sequence</div>
            <div className="flex flex-wrap gap-2">
              {shuffled.map((k, i) => (
                <div key={`${k}-${i}`}>
                  <KeyTile
                    k={k}
                    active={mode === "drill" && i === seqIdx}
                    done={i < seqIdx}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={startDrill}
              disabled={mode === "drill"}
              className="rounded-full bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-400 disabled:opacity-60"
            >
              Start drill
            </button>

            <button
              onClick={skip}
              className="rounded-full border border-slate-700 px-3 py-2 text-sm disabled:opacity-60"
            >
              Skip drill
            </button>

            <div className="ml-auto">
              <button
                onClick={startLesson}
                disabled={mode !== "done"}
                className="rounded-full px-3 py-2 text-sm font-semibold bg-emerald-500 text-slate-900 disabled:opacity-60"
              >
                Start lesson
              </button>
            </div>
          </div>

          {/* hidden textarea to capture keystrokes for the drill */}
          <textarea
            ref={hiddenRef}
            onKeyDown={handleKeyDown}
            className="absolute opacity-0 pointer-events-none h-0 w-0"
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
};

export default FamiliarizeModal;
