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
import { playTypingSound, playErrorSound } from "../../utils/sounds";
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
    evaluatePassCriteria,
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
        text: "എനിക്ക് മലയാളം ഇഷ്ടമാണ്",
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
    sound: {
        enableSounds: false,
        typingVolumePct: 50,
        errorVolumePct: 50,
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

        // migrate / ensure UI settings
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

        // --- migrate / ensure sound settings (new) ---
        // sensible defaults (percents for UI sliders)
        const SOUND_DEFAULTS = {
            enableSounds: true,
            typingVolumePct: 16,
            errorVolumePct: 70,
        };

        if (!parsed.config.sound) {
            parsed.config.sound = { ...SOUND_DEFAULTS };
        } else {
            if (parsed.config.sound.enableSounds === undefined) {
                parsed.config.sound.enableSounds = SOUND_DEFAULTS.enableSounds;
            }
            if (
                parsed.config.sound.typingVolumePct === undefined ||
                parsed.config.sound.typingVolumePct === null
            ) {
                parsed.config.sound.typingVolumePct = SOUND_DEFAULTS.typingVolumePct;
            }
            if (
                parsed.config.sound.errorVolumePct === undefined ||
                parsed.config.sound.errorVolumePct === null
            ) {
                parsed.config.sound.errorVolumePct = SOUND_DEFAULTS.errorVolumePct;
            }
        }

        return parsed;
    } catch {
        return defaultState;
    }
}

export function getLetters(): string[] {
    return LETTERS;
}
export function getCourseLessons(): CourseLesson[] {
    return COURSE_LESSONS.lessons;
}

export function useTypingModel() {
    const [state, setState] = useState<AppState>(() => loadInitialState());

    const [toastOpen, setToastOpen] = useState<boolean>(false);

    // test states
    const [currentText, setCurrentText] = useState<string>("");
    const [typedText, setTypedText] = useState<string>("");
    const [stage, setStage] = useState<Stage>("config");
    const [statusMsg, setStatusMsg] = useState<string>(
        "Pick a mode to begin practicing.",
    );
    const [statusError, setStatusError] = useState<boolean>(false);
    const [graphemeInfos, setGraphemeInfos] = useState<GraphemeInfo[]>([]);

    const [testStartTime, setTestStartTime] = useState<number | null>(null);
    const [resultStats, setResultStats] = useState<TypingMetrics | null>(null);
    const [showResult, setShowResult] = useState<boolean>(false);
    const [lessonResult, setLessonResult] = useState<{
        open: boolean;
        stats?: TypingMetrics;
        computed?: any;
        canAdvance?: boolean;
        warmupComplete?: boolean;
        lessonId?: string | null;
    }>({ open: false });

    // UI ref helpers
    const hiddenInputRef = useRef<HTMLTextAreaElement | null>(null);
    const lastStrokeInfoRef = useRef<{ wrong: boolean; fill: number }>({
        wrong: false,
        fill: 0,
    });

    const lessonIdAtStartRef = useRef<string | null>(null);

    // derived values
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

    // persist main state to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        } catch {
            // ignore
        }
    }, [state]);

    function updateConfig(updater: (cfg: AppConfig) => AppConfig) {
        setState((prev) => ({ ...prev, config: updater(prev.config) }));
    }

    function updateProgress(updater: (p: AppProgress) => AppProgress) {
        setState((prev) => ({ ...prev, progress: updater(prev.progress) }));
    }

    // ---- test generation helper ----
    function prepareTest(overrideLessonId?: string | null) {
        if (stage === "finished") return;
        setStatusError(false);

        // If overrideLessonId provided and mode is course, build a temp config
        const cfgToUse =
            config.mode === "course" && overrideLessonId !== undefined
                ? {
                    ...config,
                    course: { ...config.course, lessonId: overrideLessonId },
                }
                : config;

        const res = generateTestText({
            config: cfgToUse,
            progress,
            selectedLetters,
        });

        if (!res.ok) {
            setStatusMsg(res.reason);

            setToastOpen(true);
            setStatusError(true);
            return;
        }

        const text = res.text;
        setCurrentText(text);
        setTypedText("");
        setGraphemeInfos(buildGraphemeInfos(text));
        setStage("prestart");
        setStatusMsg("Press any key to begin the test.");
        setToastOpen(true);
        setStatusError(false);
        setTestStartTime(null);
        setResultStats(null);
        setShowResult(false);
        document.body.classList.add("test-active");

        // capture the lesson id for the test (use override first, else config fallback)
        if (cfgToUse.mode === "course") {
            const fallbackId =
                COURSE_LESSONS.lessons && COURSE_LESSONS.lessons.length > 0
                    ? COURSE_LESSONS.lessons[0].id
                    : null;
            lessonIdAtStartRef.current = cfgToUse.course.lessonId ?? fallbackId;
        } else {
            lessonIdAtStartRef.current = null;
        }

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

        setToastOpen(true);
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
        setStatusMsg("Press any key to begin the test.");

        setToastOpen(true);
        setStatusError(false);
    }

    /**
     * finishTest:
     * - for course mode: compute results, persist lesson progress (using captured lesson id),
     *   for familiarization lessons: mark pre-lesson done and auto-advance (no pass criteria).
     *   for practice lessons: evaluate pass criteria and only auto-advance if passed.
     * - for non-course modes: show ResultOverlay (resultStats + showResult) and update per-mode progress.
     */
    function finishTest(inputText: string) {
        if (stage !== "running") return;

        const { stats, computed, canAdvance } = computeResults({
            currentText,
            inputText,
            startTimeMs: testStartTime,
        });

        // COURSE MODE
        if (currentMode === "course") {
            // use the captured lesson id (from prepareTest)
            const lessonIdAtStart = lessonIdAtStartRef.current;

            const lessonObj = lessonIdAtStart
                ? (COURSE_LESSONS.lessons.find((l) => l.id === lessonIdAtStart) ?? null)
                : null;

            // Persist per-lesson progress under the captured lesson id (if present)
            if (lessonIdAtStart) {
                setState((prev) => {
                    const lessonsMap = { ...prev.progress.lessons };
                    const prevEntry = lessonsMap[lessonIdAtStart] || {
                        runs: 0,
                        bestWpm: 0,
                        bestAcc: 0,
                        lastTime: null as string | null,
                    };

                    const newEntry = { ...prevEntry };
                    newEntry.runs = (newEntry.runs || 0) + 1;
                    if (stats) {
                        if (stats.wpm > (newEntry.bestWpm || 0))
                            newEntry.bestWpm = stats.wpm;
                        if (stats.accuracy > (newEntry.bestAcc || 0))
                            newEntry.bestAcc = stats.accuracy;
                    }
                    newEntry.lastTime = new Date().toISOString();
                    lessonsMap[lessonIdAtStart] = newEntry;

                    const newProgress = { ...prev.progress, lessons: lessonsMap };
                    return { ...prev, progress: newProgress };
                });
            }

            // If this is a familiarization (warmup) lesson -> treat as completed:
            // - mark pre-lesson done (so generateTestText won't block)
            // - mark lessonResult.warmupComplete so UI can show warmup-card
            // - auto-advance to next lesson (no pass criteria check)
            if (lessonObj && lessonObj.ui_mode === "familiarization") {
                // prepare lesson result indicating warmup complete (stats included)
                setLessonResult({
                    open: true,
                    stats,
                    computed,
                    canAdvance: true, // warmup considered "allowed" to advance
                    lessonId: lessonIdAtStart ?? null,
                    warmupComplete: true,
                });

                // auto-advance to next lesson (if present) using captured id
                if (lessonIdAtStart) {
                    const idx = COURSE_LESSONS.lessons.findIndex(
                        (l) => l.id === lessonIdAtStart,
                    );
                    if (idx >= 0 && idx < COURSE_LESSONS.lessons.length - 1) {
                        const nextLesson = COURSE_LESSONS.lessons[idx + 1];
                        updateConfig((cfg) => ({
                            ...cfg,
                            course: { ...cfg.course, lessonId: nextLesson.id },
                        }));
                    } else {
                        updateConfig((cfg) => ({
                            ...cfg,
                            course: { ...cfg.course, lessonId: null },
                        }));
                    }
                }

                setResultStats(stats);
                setShowResult(false);
                setStage("finished");
                setStatusMsg(
                    "Warm-up completed. Use dialog to start practice or continue.",
                );

                setToastOpen(true);
                setStatusError(false);
                return;
            }

            // PRACTICE lesson: evaluate pass criteria (if present) and advance only if allowed
            const passEval = evaluatePassCriteria(lessonObj, stats, computed);
            // if lesson had no criteria, fallback to computed.canAdvance if available
            const fallbackCanAdvance = canAdvance && canAdvance.allowed;
            const effectiveAllowed = passEval
                ? passEval.allowed
                : !!fallbackCanAdvance;

            // set lesson result and allow UI to manage advance
            setLessonResult({
                open: true,
                stats,
                computed,
                canAdvance: !!effectiveAllowed,
                lessonId: lessonIdAtStart ?? null,
            });

            // If allowed by criteria, auto-advance now
            if (effectiveAllowed && lessonIdAtStart) {
                const idx = COURSE_LESSONS.lessons.findIndex(
                    (l) => l.id === lessonIdAtStart,
                );
                if (idx >= 0 && idx < COURSE_LESSONS.lessons.length - 1) {
                    const nextLesson = COURSE_LESSONS.lessons[idx + 1];
                    updateConfig((cfg) => ({
                        ...cfg,
                        course: { ...cfg.course, lessonId: nextLesson.id },
                    }));
                } else {
                    updateConfig((cfg) => ({
                        ...cfg,
                        course: { ...cfg.course, lessonId: null },
                    }));
                }
            }

            setResultStats(stats);
            setShowResult(false);
            setStage("finished");
            setStatusMsg(
                "Lesson completed. Use the result dialog to advance, retry or review.",
            );

            setToastOpen(true);
            setStatusError(false);
            return;
        }

        // NON-COURSE MODES -> show overlay and update mode progress
        setResultStats(stats);
        setShowResult(true);

        setState((prev) => {
            const newProgress = applyResultToProgress({
                prev: prev.progress,
                mode: currentMode,
                stats,
                courseLessonId: undefined,
            });
            return { ...prev, progress: newProgress };
        });

        setStage("finished");
        setStatusMsg("Test completed. Press Enter to retry or Esc to reset.");

        setToastOpen(true);
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
            // no typing sound on delete (optional choice)
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

        // If the lastStroke was wrong, we handle placeholders and play error sound
        if (lastStrokeInfoRef.current.wrong) {
            const { fill } = lastStrokeInfoRef.current;
            if (fill > 0) {
                val = val + PLACEHOLDER.repeat(fill);
                if (hiddenInputRef.current) {
                    hiddenInputRef.current.value = val;
                }
            }
            // Play error sound (user typed something incorrect previously)
            try {
                playErrorSound();
            } catch (err) {
                // ignore sound errors
            }
            // Clear the wrong flag so the next input proceeds normally
            lastStrokeInfoRef.current = { wrong: false, fill: 0 };
            // still continue to update typedText below
        } else {
            // normal typing sound
            try {
                playTypingSound();
            } catch {
                // ignore
            }
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
            // finished typing all graphemes -> finalize
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
                if (lessonResult?.canAdvance) {
                    handleAdvanceFromLesson();
                } else {
                    handleRetryFromLesson();
                }
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

                    setToastOpen(true);
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

    /**
     * handleAdvanceFromLesson:
     * - If warmupComplete -> nothing more to compute: pre-lesson is already marked in finishTest.
     *   Advance to next lesson (already done in finishTest) and prepareTest.
     * - Otherwise (practice result) persist progress (idempotent), advance to next lesson if allowed
     */
    const handleAdvanceFromLesson = () => {
        const lr = lessonResult;
        if (!lr.open) {
            setLessonResult({ open: false });
            return;
        }

        // Regular practice advance
        if (!lr.stats || !lr.computed) {
            setLessonResult({ open: false });
            return;
        }

        setStage("prestart");

        // Persist progress one more time idempotently (use captured lesson id)
        // Derive the lesson id we should operate on:
        const lessonIdAtStart = lessonIdAtStartRef.current;

        if (lessonIdAtStart) {
            updateProgress((prev) => {
                const lessons = { ...prev.lessons };
                const lp = lessons[lessonIdAtStart] || {
                    runs: 0,
                    bestWpm: 0,
                    bestAcc: 0,
                    lastTime: null as string | null,
                };

                // ensure we merge stats
                if (lr.stats) {
                    if (lr.stats.wpm > (lp.bestWpm ?? 0)) lp.bestWpm = lr.stats.wpm;
                    if (lr.stats.accuracy > (lp.bestAcc ?? 0))
                        lp.bestAcc = lr.stats.accuracy;
                }
                lp.lastTime = new Date().toISOString();
                lessons[lessonIdAtStart] = lp;
                return { ...prev, lessons };
            });
        }

        // Advance to next lesson if exists
        if (lessonIdAtStart) {
            const idx = COURSE_LESSONS.lessons.findIndex(
                (l) => l.id === lessonIdAtStart,
            );
            if (idx >= 0 && idx < COURSE_LESSONS.lessons.length - 1) {
                const nextLesson = COURSE_LESSONS.lessons[idx + 1];
                updateConfig((cfg) => ({
                    ...cfg,
                    course: { ...cfg.course, lessonId: nextLesson.id },
                }));
            }
        }

        setLessonResult({ open: false });
    };

    const handleRetryFromLesson = () => {
        const lr = lessonResult;
        // determine which lesson we should retry: prefer the saved lessonId on the modal
        const lessonToRetry = lr.lessonId ?? lessonIdAtStartRef.current ?? null;

        // set the captured lesson id back to the ref (so internal logic uses the correct one)
        lessonIdAtStartRef.current = lessonToRetry;

        setStage("prestart");
        setLessonResult({ open: false });

        // Prepare the test forcing the same lesson id — use the override parameter
        setTimeout(() => prepareTest(lessonToRetry), 0);
    };

    const handleReviewFromLesson = () => {
        if (lessonResult.stats) {
            setResultStats(lessonResult.stats);
            setShowResult(true);
        }
        setLessonResult({ open: false });
    };

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
        toastOpen,

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
        setToastOpen,
    };
}

export { prettyModeName, MODES_META };
export default useTypingModel;
