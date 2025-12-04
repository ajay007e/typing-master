import React from "react";
import type { AppConfig, AppProgress, CourseLesson } from "../utils/types";

import LetterPanel from "./LetterPanel";
import ParagraphPanel from "./ParagraphPanel";
import CommonWordsPanel from "./CommonWordsPanel";
import CoursePanel from "./CoursePanel";

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

  onParagraphChange: (text: string) => void;

  onCommonLenChange: (value: AppConfig["common"]["lenOption"]) => void;
  onCommonCustomChange: (value: string) => void;

  onCourseLessonChange: (lessonId: string) => void;
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
}) => {
  if (!open) return null;

  const renderPanel = () => {
    switch (mode) {
      case "letters":
        return (
          <LetterPanel
            letters={letters}
            selectedLetters={config.letters.selectedLetters || letters}
            configLetters={config.letters}
            onToggleLetter={onToggleLetter}
            onLenOptionChange={onLenOptionChange}
            onLenCustomChange={onLenCustomChange}
            onSelectAll={onSelectAll}
            onClear={onClear}
          />
        );

      case "paragraph":
        return (
          <ParagraphPanel
            text={config.paragraph.text}
            onChange={onParagraphChange}
          />
        );

      case "common":
        return (
          <CommonWordsPanel
            commonConfig={config.common}
            onLenOptionChange={onCommonLenChange}
            onCustomChange={onCommonCustomChange}
          />
        );

      case "course":
        return (
          <CoursePanel
            lessons={lessons}
            currentLesson={currentLesson}
            lessonId={config.course.lessonId}
            lessonProgressMap={progress.lessons}
            onLessonChange={onCourseLessonChange}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Configure {mode}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="max-h-[70vh] overflow-y-auto">{renderPanel()}</div>

        {/* Footer */}
        <div className="mt-3 text-right">
          <button
            onClick={onClose}
            className="rounded-full bg-emerald-500 px-4 py-1.5 text-xs font-semibold text-slate-950 hover:bg-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigModal;
