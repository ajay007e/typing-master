import React, { useEffect, useRef, useState, useCallback } from "react";
import "./index.css";

import lettersConfig from "./config/letters.json";
import commonWordsConfig from "./config/commonWords.json";
import courseLessonsConfig from "./config/course.json";

import ModeHeader from "./components/ModeHeader";
import LetterPanel from "./components/LetterPanel";
import ParagraphPanel from "./components/ParagraphPanel";
import CommonWordsPanel from "./components/CommonWordsPanel";
import CoursePanel from "./components/CoursePanel";
import TypingArea from "./components/TypingArea";
import StatusBar from "./components/StatusBar";
import ResultOverlay from "./components/ResultOverlay";
import KeyboardLayout from "./components/KeyboardLayout";

import type {
  AppState,
  AppConfig,
  AppProgress,
  CourseLesson,
  Stage,
} from "./utils/types";
import { calculateTypingMetrics } from "./utils/metrics";
import type { TypingMetrics } from "./utils/metrics";
import { getFingerInfoForChar } from "./utils/keyMapping";

const STORAGE_KEY = "typing_tutor_v1";

const LETTERS = (lettersConfig as { letters: string[] }).letters;
const COMMON_WORDS = (commonWordsConfig as { words: string[] }).words;
const COURSE_LESSONS = courseLessonsConfig as { lessons: CourseLesson[] };

// unlock rules for course
const WPM_UNLOCK = 25;
const ACC_UNLOCK = 90;

const defaultConfig: AppConfig = {
  mode: "letters",
  letters: {
    selectedLetters: null,
    lenOption: "50",
    customLength: 20,
  },
  paragraph: {
    text: "",
  },
  common: {
    lenOption: "30",
    customLength: 20,
  },
  course: {
    lessonId: null,
  },
  ui: {
    showKeyboard: true,
    allowBackspace: true,
  },
};

const defaultProgress: AppProgress = {
  modes: {},
  lessons: {},
};

const defaultState: AppState = {
  config: defaultConfig,
  progress: defaultProgress,
};

function loadInitialState(): AppState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as AppState;

    if (!parsed.config.ui) {
      parsed.config.ui = { showKeyboard: true, allowBackspace: true };
    } else if (parsed.config.ui.allowBackspace === undefined) {
      parsed.config.ui.allowBackspace = true;
    }

    return parsed;
  } catch {
    return defaultState;
  }
}

function buildLetterString(selectedLetters: string[], length: number): string {
  if (!selectedLetters.length) return "";
  let result = "";
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * selectedLetters.length);
    result += selectedLetters[idx];
    if ((i + 1) % 4 === 0 && i !== length - 1) result += " ";
  }
  return result;
}

function buildCommonParagraph(totalWords: number): string {
  if (!COMMON_WORDS.length) return "";
  const words: string[] = [];
  for (let i = 0; i < totalWords; i++) {
    const idx = Math.floor(Math.random() * COMMON_WORDS.length);
    words.push(COMMON_WORDS[idx]);
  }

  const sentences: string[] = [];
  let i = 0;
  while (i < words.length) {
    const remaining = words.length - i;
    const sentenceLen = Math.min(remaining, 6 + Math.floor(Math.random() * 9));
    const slice = words.slice(i, i + sentenceLen).join(" ");
    sentences.push(slice + " .");
    i += sentenceLen;
  }
  return sentences.join(" ").trim();
}

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => loadInitialState());
  const [currentText, setCurrentText] = useState<string>("");
  const [typedText, setTypedText] = useState<string>("");
  const [stage, setStage] = useState<Stage>("config");
  const [statusMsg, setStatusMsg] = useState<string>(
    "Configure options above and click Generate text / Start lesson to begin.",
  );
  const [statusError, setStatusError] = useState<boolean>(false);

  const hiddenInputRef = useRef<HTMLTextAreaElement | null>(null);
  const hasRecordedResultRef = useRef<boolean>(false);

  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [resultStats, setResultStats] = useState<TypingMetrics | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);

  const { config, progress } = state;
  const currentMode = config.mode;
  const modeProgress = progress.modes[currentMode];
  const nextChar =
    currentText && stage !== "config"
      ? (currentText[typedText.length] ?? null)
      : null;
  const fingerInfo = getFingerInfoForChar(nextChar || undefined);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  const selectedLetters =
    config.letters.selectedLetters && config.letters.selectedLetters.length
      ? config.letters.selectedLetters
      : LETTERS;

  const lessons = COURSE_LESSONS.lessons;
  const resolvedLesson =
    config.course.lessonId &&
      lessons.find((l) => l.id === config.course.lessonId)
      ? (lessons.find((l) => l.id === config.course.lessonId) as CourseLesson)
      : lessons[0];
  const currentLesson = resolvedLesson;

  // helpers to update state
  function updateConfig(updater: (cfg: AppConfig) => AppConfig) {
    setState((prev) => ({ ...prev, config: updater(prev.config) }));
  }

  function updateProgress(updater: (p: AppProgress) => AppProgress) {
    setState((prev) => ({ ...prev, progress: updater(prev.progress) }));
  }

  // config handlers
  function handleModeChange(mode: AppConfig["mode"]) {
    updateConfig((cfg) => ({ ...cfg, mode }));
  }

  function handleLetterToggle(ch: string) {
    updateConfig((cfg) => {
      const current = cfg.letters.selectedLetters ?? [...LETTERS];
      const exists = current.includes(ch);
      const next = exists ? current.filter((c) => c !== ch) : [...current, ch];
      return { ...cfg, letters: { ...cfg.letters, selectedLetters: next } };
    });
  }

  function selectAllLetters() {
    updateConfig((cfg) => ({
      ...cfg,
      letters: { ...cfg.letters, selectedLetters: [...LETTERS] },
    }));
  }

  function clearAllLetters() {
    updateConfig((cfg) => ({
      ...cfg,
      letters: { ...cfg.letters, selectedLetters: [] },
    }));
  }

  function handleLenOptionChange(val: AppConfig["letters"]["lenOption"]) {
    updateConfig((cfg) => ({
      ...cfg,
      letters: { ...cfg.letters, lenOption: val },
    }));
  }

  function handleLenCustomChange(val: string) {
    updateConfig((cfg) => ({
      ...cfg,
      letters: { ...cfg.letters, customLength: val },
    }));
  }

  function handleCommonLenOptionChange(val: AppConfig["common"]["lenOption"]) {
    updateConfig((cfg) => ({
      ...cfg,
      common: { ...cfg.common, lenOption: val },
    }));
  }

  function handleCommonLenCustomChange(val: string) {
    updateConfig((cfg) => ({
      ...cfg,
      common: { ...cfg.common, customLength: val },
    }));
  }

  function handleParagraphChange(text: string) {
    updateConfig((cfg) => ({
      ...cfg,
      paragraph: { ...cfg.paragraph, text },
    }));
  }

  function handleCourseLessonChange(lessonId: string) {
    updateConfig((cfg) => ({
      ...cfg,
      course: { ...cfg.course, lessonId },
    }));
  }

  function getLetterLength(): number {
    const { lenOption, customLength } = config.letters;
    if (lenOption === "custom") {
      const n = Number(customLength) || 50;
      return Math.min(Math.max(n, 10), 1000);
    }
    return Number(lenOption) || 50;
  }

  function getCommonWordsLength(): number {
    const { lenOption, customLength } = config.common;
    if (lenOption === "custom") {
      const n = Number(customLength) || 50;
      return Math.min(Math.max(n, 10), 500);
    }
    return Number(lenOption) || 50;
  }

  // test lifecycle
  function prepareTest() {
    setStatusError(false);

    let text = "";

    if (currentMode === "letters") {
      const len = getLetterLength();
      text = buildLetterString(selectedLetters, len);
      if (!text) {
        setStatusMsg("Select at least one letter to generate text.");
        setStatusError(true);
        return;
      }
    } else if (currentMode === "paragraph") {
      const t = config.paragraph.text.trim();
      if (!t) {
        setStatusMsg("Enter a Malayalam paragraph first.");
        setStatusError(true);
        return;
      }
      text = t;
    } else if (currentMode === "common") {
      const len = getCommonWordsLength();
      text = buildCommonParagraph(len);
      if (!text) {
        setStatusMsg("Common words list is empty.");
        setStatusError(true);
        return;
      }
    } else if (currentMode === "course") {
      const lesson = currentLesson;

      // locking: require previous lesson to meet threshold
      const idx = COURSE_LESSONS.lessons.findIndex((l) => l.id === lesson.id);
      if (idx > 0) {
        const prevLesson = COURSE_LESSONS.lessons[idx - 1];
        const prevProg = progress.lessons[prevLesson.id];
        const unlocked =
          prevProg &&
          prevProg.bestWpm >= WPM_UNLOCK &&
          prevProg.bestAcc >= ACC_UNLOCK;

        if (!unlocked) {
          setStatusMsg(
            `Lesson locked. Complete “${prevLesson.title}” with at least ${WPM_UNLOCK} WPM and ${ACC_UNLOCK}% accuracy to unlock this.`,
          );
          setStatusError(true);
          return;
        }
      }

      const tIndex = Math.floor(Math.random() * lesson.texts.length);
      text = lesson.texts[tIndex];
    }

    setCurrentText(text);
    setTypedText("");
    setStage("prestart");
    setStatusMsg("Press any key to begin the test.");
    setTestStartTime(null);
    setResultStats(null);
    setShowResult(false);
    hasRecordedResultRef.current = false;
    document.body.classList.add("test-active");
  }

  const startRunning = useCallback(() => {
    if (stage !== "prestart") return;
    setStage("running");
    setStatusMsg("Typing… press Esc to cancel.");
    setTestStartTime(Date.now());
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = "";
      hiddenInputRef.current.focus();
    }
  }, [stage]);

  function finishTest(inputText: string) {
    if (stage !== "running") return;
    if (hasRecordedResultRef.current) {
      return;
    }
    hasRecordedResultRef.current = true;

    const endTime = Date.now();
    const start = testStartTime ?? endTime;
    const durationMs = endTime - start;

    const stats = calculateTypingMetrics(currentText, inputText, durationMs);
    setResultStats(stats);
    setShowResult(true);

    // update global progress (per mode + per lesson)
    updateProgress((prev) => {
      const modes = { ...prev.modes };
      const lessonsProg = { ...prev.lessons };

      // per-mode stats
      const mm = modes[currentMode] || { runs: 0, bestWpm: 0, bestAcc: 0 };
      mm.runs += 1;
      if (stats.wpm > mm.bestWpm) mm.bestWpm = stats.wpm;
      if (stats.accuracy > mm.bestAcc) mm.bestAcc = stats.accuracy;
      modes[currentMode] = mm;

      // per-lesson stats only for course mode
      if (currentMode === "course") {
        const lesson = currentLesson;
        const lp = lessonsProg[lesson.id] || {
          runs: 0,
          bestWpm: 0,
          bestAcc: 0,
          lastTime: null as string | null,
        };
        lp.runs += 1;
        if (stats.wpm > lp.bestWpm) lp.bestWpm = stats.wpm;
        if (stats.accuracy > lp.bestAcc) lp.bestAcc = stats.accuracy;
        lp.lastTime = new Date().toISOString();
        lessonsProg[lesson.id] = lp;
      }

      return { modes, lessons: lessonsProg };
    });

    setStage("finished");
    setStatusMsg("Test completed. Press Esc to return to settings.");
  }

  function handleHiddenInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (stage !== "running") return;
    let val = e.target.value.replace(/\r?\n/g, "");
    if (val.length > currentText.length) {
      val = val.slice(0, currentText.length);
      e.target.value = val;
    }
    setTypedText(val);
    if (val.length === currentText.length) {
      finishTest(val);
    }
  }

  function handleTypingAreaClick() {
    if (stage === "running" && hiddenInputRef.current) {
      hiddenInputRef.current.focus();
    }
  }

  function resetToConfig() {
    setStage("config");
    setCurrentText("");
    setTypedText("");
    setStatusMsg(
      "Configure options above and click Generate text / Start lesson to begin.",
    );
    setStatusError(false);
    setShowResult(false);
    document.body.classList.remove("test-active");
  }

  // global keydown
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        resetToConfig();
        return;
      }

      if (!config.ui.allowBackspace && e.key === "Backspace") {
        e.preventDefault();
        return;
      }

      if (!currentText) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (stage === "prestart") {
        e.preventDefault();
        startRunning();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [stage, currentText, config.ui.allowBackspace, startRunning]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-50">
      <div className="w-full max-w-5xl px-4 py-6 relative">
        {stage === "config" && (
          <>
            <ModeHeader
              mode={currentMode}
              onModeChange={handleModeChange}
              onStart={prepareTest}
              showKeyboard={config.ui.showKeyboard}
              onToggleKeyboard={(val) =>
                updateConfig((cfg) => ({
                  ...cfg,
                  ui: { ...cfg.ui, showKeyboard: val },
                }))
              }
              allowBackspace={config.ui.allowBackspace}
              onToggleBackspace={(val) =>
                updateConfig((cfg) => ({
                  ...cfg,
                  ui: { ...cfg.ui, allowBackspace: val },
                }))
              }
            />

            {currentMode === "letters" && (
              <LetterPanel
                letters={LETTERS}
                selectedLetters={selectedLetters}
                configLetters={config.letters}
                onToggleLetter={handleLetterToggle}
                onLenOptionChange={handleLenOptionChange}
                onLenCustomChange={handleLenCustomChange}
                onSelectAll={selectAllLetters}
                onClear={clearAllLetters}
              />
            )}

            {currentMode === "paragraph" && (
              <ParagraphPanel
                text={config.paragraph.text}
                onChange={handleParagraphChange}
              />
            )}

            {currentMode === "common" && (
              <CommonWordsPanel
                commonConfig={config.common}
                onLenOptionChange={handleCommonLenOptionChange}
                onCustomChange={handleCommonLenCustomChange}
              />
            )}

            {currentMode === "course" && (
              <CoursePanel
                lessons={COURSE_LESSONS.lessons}
                currentLesson={currentLesson}
                lessonId={config.course.lessonId}
                lessonProgressMap={progress.lessons}
                onLessonChange={handleCourseLessonChange}
              />
            )}

            <StatusBar message={statusMsg} isError={statusError} />
          </>
        )}

        {stage !== "config" && currentText && (
          <TypingArea
            currentText={currentText}
            typedText={typedText}
            stage={stage}
            hiddenInputRef={hiddenInputRef}
            onHiddenInputChange={handleHiddenInputChange}
            onAreaClick={handleTypingAreaClick}
          />
        )}

        {stage !== "config" && (
          <div className="mt-3">
            <StatusBar message={statusMsg} isError={statusError} />
          </div>
        )}

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
      </div>
    </div>
  );
};

export default App;
