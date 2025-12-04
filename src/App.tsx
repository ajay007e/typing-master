import React, { useCallback, useEffect, useRef, useState } from "react";
import "./index.css";

import lettersConfig from "./config/letters.json";
import commonWordsConfig from "./config/commonWords.json";
import courseLessonsConfig from "./config/course.json";

import ModeHeader from "./components/ModeHeader";
import ModeSelectModal from "./components/ModeSelectModal";
import SettingsModal from "./components/SettingsModal";
import ConfigModal from "./components/ConfigModal";

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
import { isMalayalamChar } from "./utils/malayalam";
import type { GraphemeInfo } from "./utils/typingModel";
import { buildGraphemeInfos, getTypingProgress } from "./utils/typingModel";
import { KEY_TO_CODE } from "./utils/keystrokes";
import { PLACEHOLDER } from "./utils/typingModel";

const STORAGE_KEY = "typing_tutor_v1";

const LETTERS = (lettersConfig as { letters: string[] }).letters;
const COMMON_WORDS = (commonWordsConfig as { words: string[] }).words;
const COURSE_LESSONS = courseLessonsConfig as { lessons: CourseLesson[] };

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
    fontFamily: "default",
    fontSize: "text-lg",
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
      parsed.config.ui = {
        showKeyboard: true,
        allowBackspace: true,
        fontFamily: "default",
        fontSize: "text-lg",
      };
    } else {
      if (parsed.config.ui.allowBackspace === undefined) {
        parsed.config.ui.allowBackspace = true;
      }
      if (!parsed.config.ui.fontFamily) {
        parsed.config.ui.fontFamily = "default";
      }
      if (!parsed.config.ui.fontSize) {
        parsed.config.ui.fontSize = "text-lg";
      }
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

function prettyModeName(mode: AppConfig["mode"]): string {
  switch (mode) {
    case "letters":
      return "Letters";
    case "paragraph":
      return "Paragraph";
    case "common":
      return "Common letters";
    case "course":
      return "Course";
    default:
      return mode;
  }
}

const MODES_META: {
  id: AppConfig["mode"];
  label: string;
  description: string;
  icon: "keyboard" | "document" | "stats" | "graduation";
}[] = [
    {
      id: "letters",
      label: "Letters",
      description: "Practice individual letters and build finger memory.",
      icon: "keyboard",
    },
    {
      id: "paragraph",
      label: "Paragraph",
      description: "Type full paragraphs to improve flow and rhythm.",
      icon: "document",
    },
    {
      id: "common",
      label: "Common letters",
      description: "Focus on the most frequently used Malayalam letters.",
      icon: "stats",
    },
    {
      id: "course",
      label: "Course",
      description: "Follow a structured step-by-step typing course.",
      icon: "graduation",
    },
  ];

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => loadInitialState());
  const [currentText, setCurrentText] = useState<string>("");
  const [typedText, setTypedText] = useState<string>("");
  const [stage, setStage] = useState<Stage>("config");
  const [statusMsg, setStatusMsg] = useState<string>(
    "Pick a mode to begin practicing.",
  );
  const [statusError, setStatusError] = useState<boolean>(false);
  const [graphemeInfos, setGraphemeInfos] = useState<GraphemeInfo[]>([]);

  const hiddenInputRef = useRef<HTMLTextAreaElement | null>(null);
  const hasRecordedResultRef = useRef<boolean>(false);

  const lastStrokeInfoRef = useRef<{ wrong: boolean; fill: number }>({
    wrong: false,
    fill: 0,
  });

  const [testStartTime, setTestStartTime] = useState<number | null>(null);
  const [resultStats, setResultStats] = useState<TypingMetrics | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);

  // UI state
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [showModeModal, setShowModeModal] = useState<boolean>(true); // Show mode picker at start

  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") return "dark";
    const stored = localStorage.getItem("theme");
    return stored === "light" || stored === "dark" ? stored : "dark";
  });

  const { config, progress } = state;
  const currentMode = config.mode;
  const modeProgress = progress.modes[currentMode];

  const totalTypedUnits = typedText.length;
  const { charIndex: currentCharIndex, strokeIndex: currentStrokeIndex } =
    getTypingProgress(graphemeInfos, totalTypedUnits);

  let fingerInfo: { baseKey: string | null; shift: boolean } | null = null;

  if (
    stage !== "config" &&
    stage !== "finished" &&
    graphemeInfos.length > 0 &&
    currentCharIndex < graphemeInfos.length
  ) {
    const current = graphemeInfos[currentCharIndex];
    const ks = current.keystrokes;

    if (currentStrokeIndex < ks.length) {
      const k = ks[currentStrokeIndex];
      fingerInfo = { baseKey: k.key, shift: k.shift };
    }
  }

  // Persist app state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  // Apply theme
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try {
      localStorage.setItem("theme", theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const lessons = COURSE_LESSONS.lessons;
  const resolvedLesson =
    config.course.lessonId &&
      lessons.find((l) => l.id === config.course.lessonId)
      ? (lessons.find((l) => l.id === config.course.lessonId) as CourseLesson)
      : lessons[0];
  const currentLesson = resolvedLesson;

  const selectedLetters =
    config.letters.selectedLetters && config.letters.selectedLetters.length
      ? config.letters.selectedLetters
      : LETTERS;

  function updateConfig(updater: (cfg: AppConfig) => AppConfig) {
    setState((prev) => ({ ...prev, config: updater(prev.config) }));
  }

  function updateProgress(updater: (p: AppProgress) => AppProgress) {
    setState((prev) => ({ ...prev, progress: updater(prev.progress) }));
  }

  function handleModeChange(mode: AppConfig["mode"]) {
    updateConfig((cfg) => ({ ...cfg, mode }));
  }

  // Letter config handlers
  const handleLetterToggle = (ch: string) => {
    updateConfig((cfg) => {
      const current = cfg.letters.selectedLetters ?? [...LETTERS];
      const exists = current.includes(ch);
      const next = exists ? current.filter((c) => c !== ch) : [...current, ch];
      return { ...cfg, letters: { ...cfg.letters, selectedLetters: next } };
    });
  };

  const selectAllLetters = () => {
    updateConfig((cfg) => ({
      ...cfg,
      letters: { ...cfg.letters, selectedLetters: [...LETTERS] },
    }));
  };

  const clearAllLetters = () => {
    updateConfig((cfg) => ({
      ...cfg,
      letters: { ...cfg.letters, selectedLetters: [] },
    }));
  };

  const handleLenOptionChange = (val: AppConfig["letters"]["lenOption"]) => {
    updateConfig((cfg) => ({
      ...cfg,
      letters: { ...cfg.letters, lenOption: val },
    }));
  };

  const handleLenCustomChange = (val: string) => {
    updateConfig((cfg) => ({
      ...cfg,
      letters: { ...cfg.letters, customLength: val },
    }));
  };

  // Common words config
  const handleCommonLenOptionChange = (
    val: AppConfig["common"]["lenOption"],
  ) => {
    updateConfig((cfg) => ({
      ...cfg,
      common: { ...cfg.common, lenOption: val },
    }));
  };

  const handleCommonLenCustomChange = (val: string) => {
    updateConfig((cfg) => ({
      ...cfg,
      common: { ...cfg.common, customLength: val },
    }));
  };

  // Paragraph config
  const handleParagraphChange = (text: string) => {
    updateConfig((cfg) => ({
      ...cfg,
      paragraph: { ...cfg.paragraph, text },
    }));
  };

  // Course config
  const handleCourseLessonChange = (lessonId: string) => {
    updateConfig((cfg) => ({
      ...cfg,
      course: { ...cfg.course, lessonId },
    }));
  };

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
    setGraphemeInfos(buildGraphemeInfos(text));
    setStage("prestart");
    setStatusMsg("Press any key to begin the test.");
    setStatusError(false);
    setTestStartTime(null);
    setResultStats(null);
    setShowResult(false);
    hasRecordedResultRef.current = false;
    document.body.classList.add("test-active");

    setTimeout(() => {
      if (hiddenInputRef.current) {
        hiddenInputRef.current.value = "";
        hiddenInputRef.current.focus();
      }
    }, 0);
  }

  const startRunning = useCallback(() => {
    if (stage !== "prestart") return;
    setStage("running");
    setStatusMsg("Typing… press Esc to reset.");
    setStatusError(false);
    setTestStartTime(Date.now());
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = "";
      hiddenInputRef.current.focus();
    }
  }, [stage]);

  function finishTest(inputText: string) {
    if (stage !== "running") return;
    if (hasRecordedResultRef.current) return;
    hasRecordedResultRef.current = true;

    const endTime = Date.now();
    const start = testStartTime ?? endTime;
    const durationMs = endTime - start;

    const stats = calculateTypingMetrics(currentText, inputText, durationMs);
    setResultStats(stats);
    setShowResult(true);

    updateProgress((prev) => {
      const modes = { ...prev.modes };
      const lessonsProg = { ...prev.lessons };

      const mm = modes[currentMode] || { runs: 0, bestWpm: 0, bestAcc: 0 };
      mm.runs += 1;
      if (stats.wpm > mm.bestWpm) mm.bestWpm = stats.wpm;
      if (stats.accuracy > mm.bestAcc) mm.bestAcc = stats.accuracy;
      modes[currentMode] = mm;

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
    setStatusMsg("Test completed. Press Enter to retry or Esc to reset.");
    setStatusError(false);
  }

  function handleHiddenKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (stage !== "prestart" && stage !== "running") return;

    if (e.key === "Escape") return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === "Backspace") {
      lastStrokeInfoRef.current = { wrong: false, fill: 0 };
      return;
    }

    const totalTypedUnits = typedText.length;
    const { charIndex, strokeIndex } = getTypingProgress(
      graphemeInfos,
      totalTypedUnits,
    );

    if (charIndex >= graphemeInfos.length) {
      lastStrokeInfoRef.current = { wrong: false, fill: 0 };
      return;
    }

    const currentG = graphemeInfos[charIndex];
    const strokes = currentG.keystrokes;
    const expected = strokes[strokeIndex];

    if (!expected) {
      lastStrokeInfoRef.current = { wrong: false, fill: 0 };
      return;
    }
    const isShift = e.shiftKey;
    const expectedCode = KEY_TO_CODE[expected.key];

    let correct: boolean;
    if (expectedCode) {
      correct = e.code === expectedCode && isShift === expected.shift;
    } else {
      correct = e.key === expected.key && isShift === expected.shift;
    }
    if (!correct) {
      const strokesRemaining = strokes.length - (strokeIndex + 1);
      lastStrokeInfoRef.current = {
        wrong: true,
        fill: strokesRemaining,
      };
    } else {
      lastStrokeInfoRef.current = { wrong: false, fill: 0 };
    }
  }

  function handleHiddenInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (stage !== "prestart" && stage !== "running") return;

    const native = e.nativeEvent as InputEvent;
    const inputType = native.inputType;

    if (inputType === "deleteContentBackward") {
      setTypedText((prev) => {
        if (!prev.length) return prev;

        let i = prev.length - 1;
        let placeholderCount = 0;
        while (i >= 0 && prev[i] === PLACEHOLDER) {
          placeholderCount++;
          i--;
        }

        const deleteCount = placeholderCount > 0 ? placeholderCount + 1 : 1;

        const newVal = prev.slice(0, Math.max(0, prev.length - deleteCount));

        if (hiddenInputRef.current) {
          hiddenInputRef.current.value = newVal;
        }

        return newVal;
      });
      return;
    }

    let val = e.target.value.replace(/\r/g, "");

    if (lastStrokeInfoRef.current.wrong) {
      const { fill } = lastStrokeInfoRef.current;
      if (fill > 0) {
        val = val + PLACEHOLDER.repeat(fill);
        if (hiddenInputRef.current) {
          hiddenInputRef.current.value = val;
        }
      }
      lastStrokeInfoRef.current = { wrong: false, fill: 0 };
    }

    const totalStrokesRequired = graphemeInfos.reduce(
      (sum, g) => sum + (g.keystrokes.length || 1),
      0,
    );

    if (val.length > totalStrokesRequired) {
      val = val.slice(0, totalStrokesRequired);
      if (hiddenInputRef.current) {
        hiddenInputRef.current.value = val;
      }
    }

    setTypedText(val);

    const { charIndex } = getTypingProgress(graphemeInfos, val.length);

    if (charIndex >= graphemeInfos.length) {
      finishTest(val);
    }
  }

  function handleTypingAreaClick() {
    if (
      (stage === "running" || stage === "prestart") &&
      hiddenInputRef.current
    ) {
      hiddenInputRef.current.focus();
    }
  }

  // Reset current test but keep mode & text
  function resetTest() {
    if (!currentText) return;
    setTypedText("");
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = "";
    }
    setStage("prestart");
    setShowResult(false);
    setResultStats(null);
    setTestStartTime(null);
    hasRecordedResultRef.current = false;
    setStatusMsg("Press any key to begin the test.");
    setStatusError(false);
  }

  // Global keydown: Esc reset test, Enter on result, backspace prevention, start from prestart
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Enter on result overlay → repeat test
      if (showResult && e.key === "Enter") {
        e.preventDefault();
        prepareTest();
        return;
      }

      // Esc → reset current test (keep text & mode)
      if (e.key === "Escape") {
        e.preventDefault();
        resetTest();
        return;
      }

      // Prevent Backspace if disabled
      if (
        stage === "running" &&
        !config.ui.allowBackspace &&
        e.key === "Backspace"
      ) {
        e.preventDefault();
        return;
      }

      if (!currentText) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (stage === "prestart") {
        const key = e.key;

        const isLatinLetter = /^[A-Za-z]$/.test(key);
        const isMalayalam = isMalayalamChar(key);

        if (isLatinLetter && !isMalayalam) {
          e.preventDefault();
          setStatusMsg(
            "Looks like your keyboard is not in Malayalam layout. Please switch to Malayalam (InScript) and try again.",
          );
          setStatusError(true);
          return;
        }

        startRunning();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, currentText, config.ui.allowBackspace, startRunning, showResult]);

  useEffect(() => {
    if (showModeModal) return;
    if (!currentMode) return;
    prepareTest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    config.mode,
    config.letters,
    config.paragraph,
    config.common,
    config.course,
  ]);

  // Mode selection: from cards modal
  const handleModeCardSelect = (modeId: AppConfig["mode"]) => {
    handleModeChange(modeId);
    setShowModeModal(false);
    setStatusMsg("Press any key to begin the test.");
    setStatusError(false);
  };

  // Clicking mode name in header → reopen mode modal
  const handleHeaderModeClick = () => {
    setShowModeModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-slate-900 dark:text-slate-50">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6">
        <ModeHeader
          appName="Typing Master"
          selectedModeLabel={prettyModeName(currentMode)}
          onSelectedModeClick={handleHeaderModeClick}
          onOpenSettings={() => setShowSettingsModal(true)}
          onOpenConfig={() => setShowConfigModal(true)}
        />

        {/* Typing area is always visible */}
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
            fontFamily={config.ui.fontFamily}
            fontSize={config.ui.fontSize}
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

      {/* Mode selection modal */}
      <ModeSelectModal
        open={showModeModal}
        onClose={() => setShowModeModal(false)}
        modes={MODES_META}
        selectedModeId={currentMode}
        onSelectMode={handleModeCardSelect}
      />

      {/* Settings modal */}
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
        fontFamily={config.ui.fontFamily}
        fontSize={config.ui.fontSize}
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

      {/* Configuration modal */}
      <ConfigModal
        open={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        mode={currentMode}
        config={config}
        progress={progress}
        lessons={COURSE_LESSONS.lessons}
        currentLesson={currentLesson}
        letters={LETTERS}
        onToggleLetter={handleLetterToggle}
        onLenOptionChange={handleLenOptionChange}
        onLenCustomChange={handleLenCustomChange}
        onSelectAll={selectAllLetters}
        onClear={clearAllLetters}
        onParagraphChange={handleParagraphChange}
        onCommonLenChange={handleCommonLenOptionChange}
        onCommonCustomChange={handleCommonLenCustomChange}
        onCourseLessonChange={handleCourseLessonChange}
      />
    </div>
  );
};

export default App;
