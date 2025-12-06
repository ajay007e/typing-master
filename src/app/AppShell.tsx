import React, { useState } from "react";

import ModeHeader from "../components/ModeHeader";

import ModeSelectModal from "../components/ModeSelectModal";
import SettingsModal from "../components/SettingsModal";
import ConfigModal from "../components/ConfigModal";

import TypingArea from "../components/TypingArea";
import StatusBar from "../components/StatusBar";
import ResultOverlay from "../components/ResultOverlay";
import KeyboardLayout from "../components/KeyboardLayout";
import LessonResultModal from "../components/LessonResultModal";
import FamiliarizeModal from "../components/FamiliarizeModal";

import useTypingModel, {
  getCourseLessons,
  getLetters,
  prettyModeName,
  MODES_META,
} from "../features/typing/useTypingModel";

import type { CourseLesson } from "../utils/types";

export default function AppShell() {
  const {
    state,
    currentText,
    typedText,
    stage,
    hiddenInputRef,
    graphemeInfos,
    currentCharIndex,
    statusMsg,
    statusError,
    fingerInfo,
    resultStats,
    showResult,
    lessonResult,
    prepareTest,
    handleHiddenInputChange,
    handleHiddenKeyDown,
    handleTypingAreaClick,
    handleAdvanceFromLesson,
    handleRetryFromLesson,
    handleReviewFromLesson,
    updateConfig,
  } = useTypingModel();

  // UI-only state (modals / theme) kept in shell for simple separation
  const [showModeModal, setShowModeModal] = useState<boolean>(true);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [showFamiliarize, setShowFamiliarize] = useState<boolean>(false);
  const [familiarizeTarget, setFamiliarizeTarget] = useState<string | null>(
    null,
  );
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark";
    const stored = localStorage.getItem("theme");
    return stored === "light" || stored === "dark" ? stored : "dark";
  });

  // Apply theme class to document root (same behaviour as old App)
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const { config, progress } = state;
  const currentMode = config.mode;
  const modeProgress = progress.modes[currentMode];

  // handlers for mode picker
  const handleModeCardSelect = (modeId: typeof config.mode) => {
    updateConfig((cfg) => ({ ...cfg, mode: modeId }));
    setShowModeModal(false);
  };

  // The "familiarize" modal will require passing keys/title; we keep showing logic in shell
  const lessons: CourseLesson[] = getCourseLessons();
  const resolvedLesson =
    config.course.lessonId &&
      lessons.find((l) => l.id === config.course.lessonId)
      ? (lessons.find((l) => l.id === config.course.lessonId) as any)
      : lessons[0];
  const currentLesson = resolvedLesson;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-900 dark:text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6">
        <ModeHeader
          appName="Typing Master"
          selectedModeLabel={prettyModeName(currentMode)}
          onSelectedModeClick={() => setShowModeModal(true)}
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenConfig={() => setShowConfigModal(true)}
        />

        {/* Typing area always visible */}
        <main className="mt-6 flex flex-1 items-center justify-center">
          <TypingArea
            currentText={currentText}
            typedText={typedText}
            stage={stage}
            hiddenInputRef={hiddenInputRef}
            onHiddenInputChange={handleHiddenInputChange}
            onHiddenKeyDown={handleHiddenKeyDown}
            onAreaClick={handleTypingAreaClick}
            graphemeInfos={graphemeInfos}
            currentCharIndex={currentCharIndex}
            fontFamily={config.ui.fontFamily ?? "default"}
            fontSize={config.ui.fontSize ?? "text-lg"}
          />
        </main>

        <StatusBar message={statusMsg} isError={statusError} />

        {config.ui.showKeyboard && stage !== "config" && currentText && (
          <KeyboardLayout fingerInfo={fingerInfo || undefined} />
        )}

        <ResultOverlay
          show={showResult}
          stats={resultStats}
          onRepeat={prepareTest}
          modeName={currentMode}
          modeProgress={modeProgress}
        />

        <footer className="mt-6 border-t border-slate-800 pt-3 text-center text-[11px] text-slate-500">
          © {new Date().getFullYear()} Typing Master · Malayalam typing
          practice
        </footer>
      </div>

      <ModeSelectModal
        open={showModeModal}
        onClose={() => setShowModeModal(false)}
        modes={MODES_META}
        selectedModeId={currentMode}
        onSelectMode={handleModeCardSelect}
      />

      <SettingsModal
        open={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        showKeyboard={config.ui.showKeyboard}
        onToggleKeyboard={(value) =>
          updateConfig((cfg) => ({
            ...cfg,
            ui: { ...cfg.ui, showKeyboard: value },
          }))
        }
        preventBackspace={!config.ui.allowBackspace}
        onTogglePreventBackspace={(value) =>
          updateConfig((cfg) => ({
            ...cfg,
            ui: { ...cfg.ui, allowBackspace: !value },
          }))
        }
        theme={theme}
        onToggleTheme={() =>
          setTheme((prev) => (prev === "dark" ? "light" : "dark"))
        }
        fontFamily={config.ui.fontFamily ?? "default"}
        fontSize={config.ui.fontSize ?? "text-lg"}
        onChangeFontFamily={(value) =>
          updateConfig((cfg) => ({
            ...cfg,
            ui: { ...cfg.ui, fontFamily: value },
          }))
        }
        onChangeFontSize={(value) =>
          updateConfig((cfg) => ({
            ...cfg,
            ui: { ...cfg.ui, fontSize: value },
          }))
        }
      />

      <FamiliarizeModal
        open={showFamiliarize}
        onClose={() => {
          setShowFamiliarize(false);
          setFamiliarizeTarget(null);
        }}
        lessonTitle={(() => {
          if (!familiarizeTarget) return currentLesson.title;
          const t = lessons.find((l) => l.id === familiarizeTarget);
          return t ? t.title : currentLesson.title;
        })()}
        keys={(() => {
          if (!familiarizeTarget) return currentLesson.keys ?? [];
          const t = lessons.find((l) => l.id === familiarizeTarget);
          return t ? (t.keys ?? []) : (currentLesson.keys ?? []);
        })()}
        onStartLesson={() => {
          setShowFamiliarize(false);
          setFamiliarizeTarget(null);
          setTimeout(() => prepareTest(), 30);
        }}
      />

      {/* Configuration modal */}
      <ConfigModal
        open={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        mode={currentMode}
        config={config}
        progress={progress}
        lessons={lessons}
        currentLesson={currentLesson}
        letters={getLetters()}
        onToggleLetter={(ch: string) => {
          // delegated to updateConfig
          updateConfig((cfg) => {
            const current = cfg.letters.selectedLetters ?? [];
            const exists = current.includes(ch);
            const next = exists
              ? current.filter((c) => c !== ch)
              : [...current, ch];
            return {
              ...cfg,
              letters: { ...cfg.letters, selectedLetters: next },
            };
          });
        }}
        onLenOptionChange={(val) =>
          updateConfig((cfg) => ({
            ...cfg,
            letters: { ...cfg.letters, lenOption: val },
          }))
        }
        onLenCustomChange={(val) =>
          updateConfig((cfg) => ({
            ...cfg,
            letters: { ...cfg.letters, customLength: Number(val) || 0 },
          }))
        }
        onSelectAll={() =>
          updateConfig((cfg) => ({
            ...cfg,
            letters: {
              ...cfg.letters,
              selectedLetters: [...getLetters()],
            },
          }))
        }
        onClear={() =>
          updateConfig((cfg) => ({
            ...cfg,
            letters: { ...cfg.letters, selectedLetters: [] },
          }))
        }
        onParagraphChange={(text) =>
          updateConfig((cfg) => ({
            ...cfg,
            paragraph: { ...cfg.paragraph, text },
          }))
        }
        onCommonLenChange={(val) =>
          updateConfig((cfg) => ({
            ...cfg,
            common: { ...cfg.common, lenOption: val },
          }))
        }
        onCommonCustomChange={(val) =>
          updateConfig((cfg) => ({
            ...cfg,
            common: { ...cfg.common, customLength: Number(val) || 0 },
          }))
        }
        onCourseLessonChange={(lessonId: string) =>
          updateConfig((cfg) => ({
            ...cfg,
            course: { ...cfg.course, lessonId },
          }))
        }
        onFamiliarize={(lessonId?: string) => {
          setFamiliarizeTarget(lessonId ?? currentLesson.id);
          setShowFamiliarize(true);
        }}
      />

      {lessonResult.open && lessonResult.stats && lessonResult.computed && (
        <LessonResultModal
          open={true}
          onClose={() => { }}
          stats={lessonResult.stats}
          score={lessonResult.computed.score}
          parts={lessonResult.computed.parts}
          canAdvance={!!lessonResult.canAdvance}
          onAdvance={handleAdvanceFromLesson}
          onRetry={handleRetryFromLesson}
          onReview={handleReviewFromLesson}
        />
      )}
    </div>
  );
}
