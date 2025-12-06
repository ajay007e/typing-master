// src/features/typing/typingService.ts
import type {
    AppConfig,
    AppProgress,
    CourseLesson,
    LessonProgress,
} from "../../utils/types";
import { calculateTypingMetrics } from "../../utils/metrics";
import type { TypingMetrics } from "../../utils/metrics";
import { computeLessonScore, canAdvanceLesson } from "../../utils/scoring";
import { buildLetterString, buildCommonParagraph } from "./generators";
import { COURSE_LESSONS } from "./constants";

/**
 * Result when trying to generate a test text.
 */
export type GenerateTextResult =
    | {
        ok: true;
        text: string;
    }
    | {
        ok: false;
        reason: string;
        needsFamiliarize?: boolean;
    };

/**
 * Choose or build a test text given the app config and progress.
 * Pure function (no DOM / localStorage).
 */
export function generateTestText(params: {
    config: AppConfig;
    progress: AppProgress;
    selectedLetters: string[];
    preLessonDoneMap: Record<string, boolean>;
    courseLessons?: CourseLesson[]; // optional override; defaults to imported COURSE_LESSONS
}): GenerateTextResult {
    const { config, progress, selectedLetters, preLessonDoneMap } = params;
    const lessons = params.courseLessons ?? COURSE_LESSONS.lessons;
    const mode = config.mode;

    const WPM_UNLOCK = 25;
    const ACC_UNLOCK = 90;

    if (mode === "letters") {
        const lenOpt = config.letters.lenOption;
        const custom = config.letters.customLength;
        const len =
            lenOpt === "custom"
                ? Math.min(Math.max(Number(custom) || 50, 10), 1000)
                : Number(lenOpt || 50);
        const text = buildLetterString(selectedLetters, len);
        if (!text) {
            return {
                ok: false,
                reason: "Select at least one letter to generate text.",
            };
        }
        return { ok: true, text };
    }

    if (mode === "paragraph") {
        const t = (config.paragraph.text || "").trim();
        if (!t) {
            return { ok: false, reason: "Enter a Malayalam paragraph first." };
        }
        return { ok: true, text: t };
    }

    if (mode === "common") {
        const lenOpt = config.common.lenOption;
        const custom = config.common.customLength;
        const len =
            lenOpt === "custom"
                ? Math.min(Math.max(Number(custom) || 50, 10), 500)
                : Number(lenOpt || 30);
        const text = buildCommonParagraph(len);
        if (!text) {
            return { ok: false, reason: "Common words list is empty." };
        }
        return { ok: true, text };
    }

    // course mode
    if (mode === "course") {
        const lesson =
            config.course.lessonId &&
                lessons.find((l) => l.id === config.course.lessonId)
                ? (lessons.find((l) => l.id === config.course.lessonId) as CourseLesson)
                : lessons[0];

        const idx = lessons.findIndex((l) => l.id === lesson.id);
        if (idx > 0) {
            const prevLesson = lessons[idx - 1];
            const prevProg = progress.lessons?.[prevLesson.id];
            const unlocked = !!(
                prevProg &&
                prevProg.bestWpm >= WPM_UNLOCK &&
                prevProg.bestAcc >= ACC_UNLOCK
            );
            if (!unlocked) {
                return {
                    ok: false,
                    reason: `Lesson locked. Complete “${prevLesson.title}” with at least ${WPM_UNLOCK} WPM and ${ACC_UNLOCK}% accuracy to unlock this.`,
                };
            }
        }

        if (lesson.keys && lesson.keys.length && !preLessonDoneMap[lesson.id]) {
            return {
                ok: false,
                reason: "Complete pre-lesson drill or skip to start the lesson.",
                needsFamiliarize: true,
            };
        }

        const tIndex = Math.floor(Math.random() * lesson.texts.length);
        const text = lesson.texts[tIndex];
        return { ok: true, text };
    }

    return { ok: false, reason: "Unsupported mode" };
}

/**
 * Compute whether a course lesson is unlocked and the unlock requirements.
 * Pure helper used by UI (ConfigModal).
 */
export function computeLessonLockInfo(
    lessons: CourseLesson[],
    progress: AppProgress,
    idx: number,
    defaults?: { wpm?: number; acc?: number },
) {
    const WPM_UNLOCK = defaults?.wpm ?? 25;
    const ACC_UNLOCK = defaults?.acc ?? 90;

    if (idx <= 0) {
        return {
            unlocked: true,
            prevLesson: null as CourseLesson | null,
            reqWpm: WPM_UNLOCK,
            reqAcc: ACC_UNLOCK,
            prevProg: null as LessonProgress | null,
        };
    }

    const prev = lessons[idx - 1];
    const prevProg = progress.lessons?.[prev.id] ?? null;

    const th = lessons[idx].thresholds;
    const reqWpm = th?.advanceScore ?? WPM_UNLOCK;
    const reqAcc = th?.minAccuracy ?? ACC_UNLOCK;

    const unlocked = !!(
        prevProg &&
        prevProg.bestWpm >= reqWpm &&
        prevProg.bestAcc >= reqAcc
    );

    return {
        unlocked,
        prevLesson: prev,
        reqWpm,
        reqAcc,
        prevProg,
    };
}

/**
 * Compute typing metrics, lesson score and advancement info from a completed test.
 * Pure: uses calculateTypingMetrics + scoring helpers.
 */
export function computeResults(params: {
    currentText: string;
    inputText: string;
    startTimeMs: number | null; // if null uses current time (duration 0)
}): {
    stats: TypingMetrics;
    computed: ReturnType<typeof computeLessonScore>;
    canAdvance: ReturnType<typeof canAdvanceLesson>;
} {
    const { currentText, inputText, startTimeMs } = params;
    const endTime = Date.now();
    const start = startTimeMs ?? endTime;
    const durationMs = Math.max(1, endTime - start);

    const stats = calculateTypingMetrics(currentText, inputText, durationMs);
    const computed = computeLessonScore(stats);
    const adv = canAdvanceLesson(stats, computed);
    return { stats, computed, canAdvance: adv };
}

/**
 * Given existing progress, mode and a result, return an updated progress object.
 * Pure (returns new object).
 */
export function applyResultToProgress(params: {
    prev: AppProgress;
    mode: AppConfig["mode"];
    stats: TypingMetrics;
    courseLessonId?: string | null;
}): AppProgress {
    const { prev, mode, stats, courseLessonId } = params;
    const modes = { ...prev.modes };
    const lessonsProg = { ...prev.lessons };

    const mm = modes[mode] || { runs: 0, bestWpm: 0, bestAcc: 0 };
    mm.runs = (mm.runs || 0) + 1;
    if (stats.wpm > mm.bestWpm) mm.bestWpm = stats.wpm;
    if (stats.accuracy > mm.bestAcc) mm.bestAcc = stats.accuracy;
    modes[mode] = mm;

    if (mode === "course" && courseLessonId) {
        const lp = lessonsProg[courseLessonId] || {
            runs: 0,
            bestWpm: 0,
            bestAcc: 0,
            lastTime: null as string | null,
        };
        lp.runs = (lp.runs || 0) + 1;
        if (stats.wpm > lp.bestWpm) lp.bestWpm = stats.wpm;
        if (stats.accuracy > lp.bestAcc) lp.bestAcc = stats.accuracy;
        lp.lastTime = new Date().toISOString();
        lessonsProg[courseLessonId] = lp;
    }

    return { modes, lessons: lessonsProg };
}
