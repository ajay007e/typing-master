// src/features/typing/useTypingModel.ts
import { useCallback, useEffect, useRef, useState } from "react";

import type {
    AppState,
    AppConfig,
    AppProgress,
    Stage,
    CourseLesson,
} from "../../utils/types";

import type { TypingMetrics } from "../../utils/metrics";
import { isMalayalamChar } from "../../utils/malayalam";
import type { GraphemeInfo } from "../../utils/typingModel";
import {
    buildGraphemeInfos,
    getTypingProgress,
    PLACEHOLDER,
} from "../../utils/typingModel";
import { KEY_TO_CODE } from "../../utils/keystrokes";

/* -------------------- imported constants / service -------------------- */
import {
    LETTERS,
    COURSE_LESSONS,
    prettyModeName,
    MODES_META,
} from "./constants";

import {
    generateTestText,
    computeResults,
    applyResultToProgress,
} from "./typingService";
/* --------------------------------------------------------------------- */

const STORAGE_KEY = "typing_tutor_v1";

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

/**
 * Named helpers exported from this module so consumers can import them directly:
 * - getLetters()
 * - getCourseLessons()
 *
 * (This is simpler & type-safe than relying on dynamically attached properties
 * on the hook function object.)
 */
export function getLetters(): string[] {
    return LETTERS;
}
export function getCourseLessons(): CourseLesson[] {
    return COURSE_LESSONS.lessons;
}

export function useTypingModel() {
    const [state, setState] = useState<AppState>(() => loadInitialState());

    // typed/test state
    const [currentText, setCurrentText] = useState<string>("");
    const [typedText, setTypedText] = useState<string>("");
    const [stage, setStage] = useState<Stage>("config");
    const [statusMsg, setStatusMsg] = useState<string>(
        "Pick a mode to begin practicing.",
    );
    const [statusError, setStatusError] = useState<boolean>(false);
    const [graphemeInfos, setGraphemeInfos] = useState<GraphemeInfo[]>([]);
    const [preLessonDoneMap, setPreLessonDoneMap] = useState<
        Record<string, boolean>
    >({});
    const [testStartTime, setTestStartTime] = useState<number | null>(null);
    const [resultStats, setResultStats] = useState<TypingMetrics | null>(null);
    const [showResult, setShowResult] = useState<boolean>(false);
    const [lessonResult, setLessonResult] = useState<{
        open: boolean;
        stats?: TypingMetrics;
        computed?: any;
        canAdvance?: boolean;
    }>({ open: false });

    // UI helpers
    const hiddenInputRef = useRef<HTMLTextAreaElement | null>(null);
    const hasRecordedResultRef = useRef<boolean>(false);
    const lastStrokeInfoRef = useRef<{ wrong: boolean; fill: number }>({
        wrong: false,
        fill: 0,
    });

    // derived
    const { config, progress } = state;
    const currentMode = config.mode;
    const modeProgress = progress.modes[currentMode];
    const selectedLetters =
        config.letters.selectedLetters && config.letters.selectedLetters.length
            ? config.letters.selectedLetters
            : LETTERS;

    const totalTypedUnits = typedText.length;
    const { charIndex: currentCharIndex } = getTypingProgress(
        graphemeInfos,
        totalTypedUnits,
    );

    // finger info for keyboard
    let fingerInfo: { baseKey: string | null; shift: boolean } | null = null;

    if (
        stage !== "config" &&
        stage !== "finished" &&
        graphemeInfos.length > 0 &&
        currentCharIndex < graphemeInfos.length
    ) {
        const current = graphemeInfos[currentCharIndex];
        const ks = current.keystrokes;
        if (ks && ks.length) {
            const strokeIndex = getTypingProgress(
                graphemeInfos,
                totalTypedUnits,
            ).strokeIndex;
            if (strokeIndex < ks.length) {
                const k = ks[strokeIndex];
                fingerInfo = { baseKey: k.key, shift: k.shift };
            }
        }
    }

    // persist state to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {
            // ignore
        }
    }, [state]);

    // ---- helpers to update config/progress (moved from App) ----
    function updateConfig(updater: (cfg: AppConfig) => AppConfig) {
        setState((prev) => ({ ...prev, config: updater(prev.config) }));
    }

    function updateProgress(updater: (p: AppProgress) => AppProgress) {
        setState((prev) => ({ ...prev, progress: updater(prev.progress) }));
    }

    // ---- test generation helpers (now use typingService) ----
    function prepareTest() {
        setStatusError(false);

        const res = generateTestText({
            config,
            progress,
            selectedLetters,
            preLessonDoneMap,
            courseLessons: COURSE_LESSONS.lessons,
        });

        if (!res.ok) {
            setStatusMsg(res.reason);
            setStatusError(true);
            // if needsFamiliarize = true the UI should show the familiarize modal
            return;
        }

        const text = res.text;
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

    function resetTest() {
        if (!currentText) return;
        setTypedText("");
        if (hiddenInputRef.current) hiddenInputRef.current.value = "";
        setStage("prestart");
        setShowResult(false);
        setResultStats(null);
        setTestStartTime(null);
        hasRecordedResultRef.current = false;
        setStatusMsg("Press any key to begin the test.");
        setStatusError(false);
    }

    function finishTest(inputText: string) {
        if (stage !== "running") return;
        if (hasRecordedResultRef.current) return;
        hasRecordedResultRef.current = true;

        const { stats, computed, canAdvance } = computeResults({
            currentText,
            inputText,
            startTimeMs: testStartTime,
        });

        setResultStats(stats);
        setShowResult(false);

        setLessonResult({
            open: true,
            stats,
            computed,
            canAdvance: canAdvance.allowed,
        });

        // update per-mode progress (pure)
        setState((prev) => {
            const newProgress = applyResultToProgress({
                prev: prev.progress,
                mode: currentMode,
                stats,
                courseLessonId:
                    currentMode === "course"
                        ? (prev.config.course.lessonId ?? COURSE_LESSONS.lessons[0].id)
                        : undefined,
            });
            return { ...prev, progress: newProgress };
        });

        setStage("finished");
        setStatusMsg("Test completed. Press Enter to retry or Esc to reset.");
        setStatusError(false);
    }

    // Hidden input handlers
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

    // Global keydown
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (lessonResult.open && e.key === "Enter") {
                e.preventDefault();
                setLessonResult({ open: false });
                resetTest();
                return;
            }

            if (showResult && e.key === "Enter") {
                e.preventDefault();
                prepareTest();
                return;
            }

            if (e.key === "Escape") {
                e.preventDefault();
                resetTest();
                return;
            }

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
    }, [
        stage,
        currentText,
        config.ui.allowBackspace,
        startRunning,
        showResult,
        lessonResult.open,
    ]);

    // regenerate text when mode or config changes
    useEffect(() => {
        prepareTest();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        config.mode,
        config.letters,
        config.paragraph,
        config.common,
        config.course,
    ]);

    // Advance handlers used by LessonResultModal
    const handleAdvanceFromLesson = () => {
        const lr = lessonResult;
        if (!lr.open || !lr.stats || !lr.computed) {
            setLessonResult({ open: false });
            return;
        }

        // update lesson progress (mark best)
        updateProgress((prev) => {
            const lessons = { ...prev.lessons };
            const lessonId = config.course.lessonId ?? COURSE_LESSONS.lessons[0].id;
            const lp = lessons[lessonId] || {
                runs: 0,
                bestWpm: 0,
                bestAcc: 0,
                lastTime: null as string | null,
            };

            lp.runs = (lp.runs || 0) + 1;

            const stats = lr.stats;
            if (stats) {
                if (stats.wpm > lp.bestWpm) lp.bestWpm = stats.wpm;
                if (stats.accuracy > lp.bestAcc) lp.bestAcc = stats.accuracy;
            }

            lp.lastTime = new Date().toISOString();
            lessons[lessonId] = lp;
            return { ...prev, lessons };
        });

        // unlock / move to next lesson if exists
        const idx = COURSE_LESSONS.lessons.findIndex(
            (l) => l.id === (config.course.lessonId ?? COURSE_LESSONS.lessons[0].id),
        );
        if (idx >= 0 && idx < COURSE_LESSONS.lessons.length - 1) {
            const nextLesson = COURSE_LESSONS.lessons[idx + 1];
            updateConfig((cfg) => ({
                ...cfg,
                course: { ...cfg.course, lessonId: nextLesson.id },
            }));
        }

        setLessonResult({ open: false });
        setTimeout(() => {
            prepareTest();
        }, 50);
    };

    const handleRetryFromLesson = () => {
        setLessonResult({ open: false });
        resetTest();
    };

    const handleReviewFromLesson = () => {
        if (lessonResult.stats) {
            setResultStats(lessonResult.stats);
            setShowResult(true);
        }
        setLessonResult({ open: false });
    };

    // Mark pre-lesson done (used by UI Familiarize onStart)
    function markPreLessonDone(lessonId: string) {
        setPreLessonDoneMap((prev) => ({ ...prev, [lessonId]: true }));
    }

    // Expose a compact API object
    return {
        // state
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
        modeProgress,
        preLessonDoneMap,

        // actions
        prepareTest,
        resetTest,
        handleHiddenInputChange,
        handleHiddenKeyDown,
        handleTypingAreaClick,
        handleAdvanceFromLesson,
        handleRetryFromLesson,
        handleReviewFromLesson,
        updateConfig,
        markPreLessonDone,
    };
}

export { prettyModeName, MODES_META };
export default useTypingModel;
