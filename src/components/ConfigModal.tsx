// src/components/ConfigModal.tsx
import React, { useMemo } from "react";
import type {
  AppConfig,
  AppProgress,
  CourseLesson,
  LessonProgress,
} from "../utils/types";
import LettersGrid from "./ui/LettersGrid";
import RadioButtons from "./ui/RadioButtons";

interface ConfigModalProps {
  open: boolean;
  onClose: () => void;

  mode: AppConfig["mode"];
  config: AppConfig;
  progress: AppProgress;

  lessons: CourseLesson[];
  currentLesson: CourseLesson;

  letters: string[];

  onToggleLetter: (ch: string) => void;
  onLenOptionChange: (value: AppConfig["letters"]["lenOption"]) => void;
  onLenCustomChange: (value: string) => void;
  onSelectAll: () => void;
  onClear: () => void;

  onParagraphChange: (value: string) => void;

  onCommonLenChange: (value: AppConfig["common"]["lenOption"]) => void;
  onCommonCustomChange: (value: string) => void;

  onCourseLessonChange: (lessonId: string) => void;

  onFamiliarize?: (lessonId?: string) => void;
}

const WPM_UNLOCK_DEFAULT = 25;
const ACC_UNLOCK_DEFAULT = 90;

function computeLessonLockInfo(
  lessons: CourseLesson[],
  progress: AppProgress,
  idx: number,
) {
  if (idx <= 0) {
    return {
      unlocked: true,
      prevLesson: null as CourseLesson | null,
      reqWpm: WPM_UNLOCK_DEFAULT,
      reqAcc: ACC_UNLOCK_DEFAULT,
      prevProg: null as LessonProgress | null,
    };
  }

  const prev = lessons[idx - 1];
  const prevProg = progress.lessons?.[prev.id] ?? null;

  // thresholds may be absent; course.json uses "thresholds" or similar fields.
  // Use 'any' to avoid TS errors if your CourseLesson type doesn't include thresholds.
  const th = (prev as CourseLesson).pass_criteria;
  const reqWpm = th?.wpm ?? WPM_UNLOCK_DEFAULT;
  const reqAcc = th?.accuracy_percentage ?? ACC_UNLOCK_DEFAULT;
  const type = th?.type ?? "performance";

  const unlocked = !!(
    prevProg &&
    (type === "completed" ||
      ((prevProg.bestWpm ?? 0) >= reqWpm && (prevProg.bestAcc ?? 0) >= reqAcc))
  );

  return {
    unlocked,
    prevLesson: prev,
    reqWpm,
    reqAcc,
    prevProg,
  };
}

const ConfigModal: React.FC<ConfigModalProps> = ({
  open,
  onClose,
  mode,
  config,
  progress,
  lessons,
  currentLesson,
  letters,
  onToggleLetter,
  onLenOptionChange,
  onLenCustomChange,
  onSelectAll,
  onClear,
  onParagraphChange,
  onCommonLenChange,
  onCommonCustomChange,
  onCourseLessonChange,
  onFamiliarize,
}) => {
  if (!open) return null;

  const selectedLettersSet = useMemo(
    () => new Set(config.letters.selectedLetters ?? []),
    [config.letters.selectedLetters],
  );

  const LettersConfig: React.FC = () => {
    const lenOption = config.letters.lenOption;
    const custom = config.letters.customLength;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-200">
              Letter set
            </div>
            <div className="text-[11px] text-slate-400">
              Choose which letters to include.
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button onClick={onSelectAll} className="hover:text-slate-200">
              All
            </button>
            <span>/</span>
            <button onClick={onClear} className="hover:text-slate-200">
              Clear
            </button>
          </div>
        </div>

        <LettersGrid
          letters={letters}
          selected={selectedLettersSet}
          onToggleLetter={onToggleLetter}
        />

        <div className="pt-3 border-t border-slate-800 flex items-center gap-3 text-xs">
          <span className="text-slate-400">Length</span>

          <div className="flex items-center gap-2">
            <RadioButtons
              options={["50", "100", "200"]}
              value={lenOption}
              onChange={(v) =>
                onLenOptionChange(v as AppConfig["letters"]["lenOption"])
              }
            />

            <button
              onClick={() => onLenOptionChange("custom")}
              className={[
                "rounded-full px-2 py-0.5",
                lenOption === "custom"
                  ? "bg-emerald-500 text-black"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800",
              ].join(" ")}
            >
              Custom
            </button>
          </div>

          {lenOption === "custom" && (
            <input
              type="number"
              min={10}
              max={1000}
              value={custom}
              onChange={(e) => onLenCustomChange(e.target.value)}
              className="ml-auto w-20 rounded-full border border-slate-700 bg-slate-950 px-2 py-1 text-xs"
            />
          )}
        </div>
      </div>
    );
  };

  const ParagraphConfig: React.FC = () => (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-slate-200">
        Custom paragraph
      </div>
      <textarea
        className="w-full min-h-[96px] resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        value={config.paragraph.text}
        onChange={(e) => onParagraphChange(e.target.value)}
        placeholder="Paste Malayalam text here..."
      />
    </div>
  );

  const CommonConfig: React.FC = () => {
    const lenOption = config.common.lenOption;
    const custom = config.common.customLength;

    return (
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-200">Common words</div>
        <div className="text-[11px] text-slate-400">
          Random paragraph from high-frequency Malayalam words.
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400">Words</span>

          <div className="flex items-center gap-2">
            <RadioButtons
              options={["30", "60", "120"]}
              value={lenOption}
              onChange={(v) =>
                onCommonLenChange(v as AppConfig["common"]["lenOption"])
              }
            />
            <button
              onClick={() => onCommonLenChange("custom")}
              className={[
                "rounded-full px-2 py-0.5",
                lenOption === "custom"
                  ? "bg-emerald-500 text-black"
                  : "bg-slate-900 text-slate-300 hover:bg-slate-800",
              ].join(" ")}
            >
              Custom
            </button>
          </div>

          {lenOption === "custom" && (
            <input
              type="number"
              min={10}
              max={500}
              value={custom}
              onChange={(e) => onCommonCustomChange(e.target.value)}
              className="ml-auto w-20 rounded-full border border-slate-700 bg-slate-950 px-2 py-1 text-xs"
            />
          )}
        </div>
      </div>
    );
  };

  const CourseConfig: React.FC = () => {
    const lessonProgress = progress.lessons ?? {};

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-200">Course</div>
            <div className="text-[11px] text-slate-400">
              Select a lesson. Locked lessons indicate prerequisites to unlock.
            </div>
          </div>

          {currentLesson.keys &&
            currentLesson.keys.length > 0 &&
            onFamiliarize && (
              <button
                onClick={() => onFamiliarize(currentLesson.id)}
                className="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-slate-900 hover:bg-emerald-400"
              >
                Familiarize
              </button>
            )}
        </div>

        {/* TOP DROPDOWN REMOVED - selection is handled via per-lesson Select buttons below */}

        <div className="text-xs text-slate-400">Lesson progress</div>

        <div className="space-y-2">
          {lessons.map((l, idx) => {
            const lp: LessonProgress | undefined = lessonProgress[l.id];
            const lockInfo = computeLessonLockInfo(lessons, progress, idx);
            const unlocked = lockInfo.unlocked;

            const lockReason =
              !unlocked && lockInfo.prevLesson
                ? `Complete ${lockInfo.prevLesson.title}`
                : null;

            // check ui_mode for familiarization (allow both common spellings to be safe)
            const uiMode = (l as any).ui_mode;
            const isFamiliarization =
              uiMode === "familiarization" || uiMode === "familarization";

            return (
              <div
                key={l.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 p-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-slate-100">
                      {l.title}
                    </div>
                    {!unlocked && (
                      <div
                        className="ml-2 rounded-full bg-amber-600/20 px-2 py-0.5 text-[11px] text-amber-200"
                        title={lockReason ?? ""}
                      >
                        Locked
                      </div>
                    )}
                  </div>

                  <div className="mt-0.5 text-xs text-slate-400">
                    {!unlocked ? (
                      // not unlocked -> show reason
                      <div className="mt-1 text-[11px] text-amber-200/90">
                        {lockReason}
                      </div>
                    ) : isFamiliarization ? (
                      // unlocked + familiarization -> completed
                      <span className="text-emerald-300 font-medium">
                        Completed
                      </span>
                    ) : lp ? (
                      // unlocked + has progress -> show metrics
                      `${(lp.bestWpm ?? 0).toFixed(1)} WPM · ${(lp.bestAcc ?? 0).toFixed(0)}%`
                    ) : (
                      // unlocked + no progress -> not attempted
                      "Not attempted"
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {l.keys && l.keys.length > 0 && onFamiliarize && (
                    <button
                      onClick={() => onFamiliarize(l.id)}
                      disabled={!unlocked}
                      className={[
                        "rounded-full px-3 py-1 text-xs font-semibold",
                        unlocked
                          ? "bg-emerald-500 text-slate-900 hover:bg-emerald-400"
                          : "bg-slate-800 text-slate-500 cursor-not-allowed",
                      ].join(" ")}
                    >
                      Familiarize
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (!unlocked) return;
                      onCourseLessonChange(l.id);
                      // close modal after selecting
                      onClose();
                    }}
                    disabled={!unlocked}
                    className={[
                      "rounded-md px-2 py-1 text-xs",
                      unlocked
                        ? "bg-slate-800 hover:bg-slate-700"
                        : "bg-slate-800/50 text-slate-500 cursor-not-allowed",
                    ].join(" ")}
                  >
                    Select
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[115] flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div
        className="
          w-full max-w-3xl
          max-h-[85vh]
          overflow-hidden
          rounded-2xl
          border border-slate-700
          bg-slate-950/95
          shadow-2xl
        "
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-semibold text-slate-100">
              Configuration
            </h3>
            <div className="text-xs text-slate-400">
              Adjust settings for this mode.
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-slate-900/40"
          >
            Close
          </button>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="px-5 py-4 overflow-y-auto custom-scrollbar max-h-[calc(85vh-70px)]">
          {mode === "letters" && <LettersConfig />}
          {mode === "paragraph" && <ParagraphConfig />}
          {mode === "common" && <CommonConfig />}
          {mode === "course" && <CourseConfig />}
        </div>

        {/* FOOTER */}
        <div className="px-5 py-3 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-1.5 text-xs border border-slate-600 bg-slate-800 hover:bg-slate-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ConfigModal);
