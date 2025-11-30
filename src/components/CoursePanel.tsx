import React from "react";
import type { CourseLesson, ProgressLesson } from "../utils/types";

interface CoursePanelProps {
  lessons: CourseLesson[];
  currentLesson: CourseLesson;
  lessonId: string | null;
  lessonProgressMap: Record<string, ProgressLesson | undefined>;
  onLessonChange: (lessonId: string) => void;
}

const WPM_THRESHOLD = 20;
const ACC_THRESHOLD = 90;

const CoursePanel: React.FC<CoursePanelProps> = ({
  lessons,
  currentLesson,
  lessonId,
  lessonProgressMap,
  onLessonChange,
}) => {
  // Determine if a lesson is unlocked:
  // - first lesson is always unlocked
  // - other lessons: previous lesson must have bestWpm >= 25 and bestAcc >= 90
  const isLessonUnlocked = (idx: number): boolean => {
    if (idx === 0) return true;
    const prev = lessons[idx - 1];
    const prevProg = lessonProgressMap[prev.id];
    if (!prevProg) return false;
    return (
      prevProg.bestWpm >= WPM_THRESHOLD && prevProg.bestAcc >= ACC_THRESHOLD
    );
  };

  const currentId = lessonId ?? currentLesson.id;

  return (
    <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950 p-3">
      <div className="mb-1 text-xs font-semibold text-slate-200">Course</div>
      <div className="mb-2 text-[11px] text-slate-400">
        Unlock next level with ≥ {WPM_THRESHOLD} WPM and ≥ {ACC_THRESHOLD}%
        accuracy.
      </div>

      {/* Lesson selector */}
      <select
        className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
        value={currentId}
        onChange={(e) => {
          const targetId = e.target.value;
          const idx = lessons.findIndex((l) => l.id === targetId);
          if (idx === -1) return;
          if (!isLessonUnlocked(idx)) return; // extra safety
          onLessonChange(targetId);
        }}
      >
        {(() => {
          let lastCat: string | null = null;
          const items: JSX.Element[] = [];
          lessons.forEach((lesson, idx) => {
            const unlocked = isLessonUnlocked(idx);

            if (lesson.category !== lastCat) {
              items.push(
                <option key={`grp-${lesson.category}`} disabled>
                  ─── {lesson.category} ───
                </option>,
              );
              lastCat = lesson.category;
            }
            items.push(
              <option key={lesson.id} value={lesson.id} disabled={!unlocked}>
                {unlocked ? "" : "🔒 "}
                {lesson.title}
              </option>,
            );
          });
          return items;
        })()}
      </select>

      {/* Lesson card */}
      <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5">
        <div className="text-sm font-semibold text-slate-100">
          {currentLesson.title}
        </div>

        <div className="mt-0.5 text-xs text-slate-400">
          {currentLesson.desc}
        </div>

        <div className="mt-2 text-sm tracking-wide text-slate-200">
          {currentLesson.texts.join(" · ")}
        </div>

        <div className="mt-2 text-[11px] text-slate-400">
          {lessonProgressMap[currentLesson.id] ? (
            <>
              {lessonProgressMap[currentLesson.id]!.runs} runs ·{" "}
              {lessonProgressMap[currentLesson.id]!.bestWpm.toFixed(1)} WPM ·{" "}
              {lessonProgressMap[currentLesson.id]!.bestAcc.toFixed(0)}%
              accuracy
            </>
          ) : (
            <>Not completed yet</>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoursePanel;
