import { useState, useEffect } from "react";

import ModeHeader from "../components/ModeHeader";

import ModeSelectModal from "../components/ModeSelectModal";
import SettingsModal from "../components/SettingsModal";
import ConfigModal from "../components/ConfigModal";

import TypingArea from "../components/TypingArea";
import StatusBar from "../components/StatusBar";
import ResultOverlay from "../components/ResultOverlay";
import KeyboardLayout from "../components/KeyboardLayout";
import LessonResultModal from "../components/LessonResultModal";

import useTypingModel, {
  getCourseLessons,
  getLetters,
  prettyModeName,
  MODES_META,
} from "../features/typing/useTypingModel";

import type { CourseLesson } from "../utils/types";
import type { TypingMetrics } from "../utils/metrics";
import { setSoundConfig } from "../utils/sounds";

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
    toastOpen,
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
    setToastOpen,
  } = useTypingModel();

  const { config, progress } = state;
  const currentMode = config.mode;
  const modeProgress = progress.modes[currentMode];

  const soundConfig = {
    enableSounds: config.sound.enableSounds,
    typingVolumePct: config.sound.typingVolumePct,
    errorVolumePct: config.sound.errorVolumePct,
  };

  // Sync the native sound player whenever the saved config changes
  useEffect(() => {
    setSoundConfig({
      enableSounds: !!soundConfig.enableSounds,
      typingVolume: Math.max(
        0,
        Math.min(1, (soundConfig.typingVolumePct ?? 0) / 100),
      ),
      errorVolume: Math.max(
        0,
        Math.min(1, (soundConfig.errorVolumePct ?? 0) / 100),
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // intentionally watch the raw saved values to keep sound player consistent with cache
    config.sound?.enableSounds,
    config.sound?.typingVolumePct,
    config.sound?.errorVolumePct,
  ]);
  // UI-only state (modals / theme) kept in shell for simple separation
  const [showModeModal, setShowModeModal] = useState<boolean>(
    currentMode === undefined,
  );
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);

  // handlers for mode picker
  const handleModeCardSelect = (modeId: typeof config.mode) => {
    updateConfig((cfg) => ({ ...cfg, mode: modeId }));
    setShowModeModal(false);
  };

  // The "familiarize" modal will require passing keys/title; we keep showing logic in shell
  const lessons: CourseLesson[] = getCourseLessons();
  const currentLesson =
    config.course.lessonId &&
      lessons.find((l) => l.id === config.course.lessonId)
      ? (lessons.find((l) => l.id === config.course.lessonId) as CourseLesson)
      : lessons[0];

  // helper to build a minimal TypingMetrics object for warmup-only dialogs
  function makeWarmupDummyStats(): TypingMetrics {
    return {
      wpm: 0,
      rawWpm: 0,
      accuracy: 100,
      correct: 0,
      incorrect: 0,
      extra: 0,
      missed: 0,
      totalTyped: 0,
      durationMs: 0,
    } as TypingMetrics;
  }

  // defaults for parts/score when warmup only
  const warmupDefaultParts = {
    wpmScore: 0,
    rawScore: 0,
    accScore: 0,
    completenessScore: 0,
    missing: 0,
  };

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

        <StatusBar
          open={toastOpen}
          message={statusMsg}
          isError={statusError}
          onClose={() => setToastOpen(false)}
        />

        {config.ui.showKeyboard && stage !== "config" && currentText && (
          <KeyboardLayout fingerInfo={fingerInfo || undefined} />
        )}

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
        /* --- SOUND: pass current saved values (use defaults if missing) --- */
        enableSounds={soundConfig.enableSounds}
        onToggleSounds={(val: boolean) =>
          updateConfig((cfg) => ({
            ...cfg,
            sound: {
              ...(cfg.sound ?? {}),
              enableSounds: val,
            },
          }))
        }
        typingVolume={soundConfig.typingVolumePct}
        onChangeTypingVolume={(pct: number) =>
          updateConfig((cfg) => ({
            ...cfg,
            sound: {
              ...(cfg.sound ?? {}),
              typingVolumePct: pct,
            },
          }))
        }
        errorVolume={soundConfig.errorVolumePct}
        onChangeErrorVolume={(pct: number) =>
          updateConfig((cfg) => ({
            ...cfg,
            sound: {
              ...(cfg.sound ?? {}),
              errorVolumePct: pct,
            },
          }))
        }
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
      />

      {/* Show lesson result modal for course mode (including warmup-complete case).
          For non-course modes the ResultOverlay above will handle results. */}
      {lessonResult.open &&
        (lessonResult.stats || lessonResult.warmupComplete) && (
          <LessonResultModal
            open={true}
            onClose={() => { }}
            stats={lessonResult.stats ?? makeWarmupDummyStats()}
            score={lessonResult.computed?.score ?? 0}
            parts={lessonResult.computed?.parts ?? warmupDefaultParts}
            canAdvance={!!lessonResult.canAdvance}
            onAdvance={handleAdvanceFromLesson}
            onRetry={handleRetryFromLesson}
            onReview={handleReviewFromLesson}
            lesson={(() => {
              // pass lesson info to modal so it can decide warmup vs practice
              const lessons = getCourseLessons();
              const id = lessonResult.lessonId ?? (lessons[0] && lessons[0].id);
              return lessons.find((l) => l.id === id) ?? undefined;
            })()}
          />
        )}

      {/* Result overlay used for non-course modes (and can still appear for course mode if you want) */}
      <ResultOverlay
        show={showResult}
        stats={resultStats}
        onRepeat={prepareTest}
        modeName={currentMode}
        modeProgress={modeProgress}
      />
    </div>
  );
}
