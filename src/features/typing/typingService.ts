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

export type GenerateTextResult =
    | {
        ok: true;
        text: string;
    }
    | {
        ok: false;
        reason: string;
    };

export function generateTestText(params: {
    config: AppConfig;
    progress: AppProgress;
    selectedLetters: string[];
}): GenerateTextResult {
    const { config, progress, selectedLetters } = params;
    const lessons = COURSE_LESSONS.lessons;
    const mode = config.mode;

    const WPM_UNLOCK = 25;
    const ACC_UNLOCK = 90;

    // LETTERS MODE
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

    // PARAGRAPH MODE
    if (mode === "paragraph") {
        const t = (config.paragraph.text || "").trim();
        if (!t) {
            return { ok: false, reason: "Enter a Malayalam paragraph first." };
        }
        return { ok: true, text: t };
    }

    // COMMON MODE
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

    // COURSE MODE
    if (mode === "course") {
        const lesson =
            config.course.lessonId &&
                lessons.find((l) => l.id === config.course.lessonId)
                ? (lessons.find((l) => l.id === config.course.lessonId) as CourseLesson)
                : lessons[0];
        if (!lesson) {
            return { ok: false, reason: "No course lessons available." };
        }

        const idx = lessons.findIndex((l) => l.id === lesson.id);

        if (idx > 0) {
            const prevLesson = lessons[idx - 1];
            const prevProg = progress.lessons?.[prevLesson.id];
            const unlocked = !!(
                prevLesson.pass_criteria.type == "completed" ||
                (prevProg &&
                    (prevProg.bestWpm ?? 0) >= (prevLesson.pass_criteria?.wpm ?? 0) &&
                    (prevProg.bestAcc ?? 0) >=
                    (prevLesson.pass_criteria?.accuracy_percentage ?? 0))
            );
            if (!unlocked) {
                return {
                    ok: false,
                    reason: `Lesson locked. Complete “${prevLesson.title}” with at least ${WPM_UNLOCK} WPM and ${ACC_UNLOCK}% accuracy to unlock this.`,
                };
            }
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
 *
 * This function is tolerant: it reads pass_criteria (new) or thresholds (legacy)
 * to determine required WPM / accuracy.
 */
export function computeLessonLockInfo(
    lessons: CourseLesson[],
    progress: AppProgress,
    idx: number,
    defaults?: { wpm?: number; acc?: number; sco?: number },
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

    const thisLesson = lessons[idx];
    const passCriteria = (thisLesson as any).pass_criteria;
    const reqWpm =
        passCriteria && passCriteria.wpm !== undefined
            ? Number(passCriteria.wpm)
            : WPM_UNLOCK;
    const reqAcc =
        passCriteria && passCriteria.accuracy_percentage !== undefined
            ? Number(passCriteria.accuracy_percentage)
            : ACC_UNLOCK;

    const unlocked = !!(
        prevProg &&
        (prevProg.bestWpm ?? 0) >= reqWpm &&
        (prevProg.bestAcc ?? 0) >= reqAcc
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
 * Evaluate pass criteria for a lesson using the stats & computed result.
 * - lesson: CourseLesson | null
 * - stats: TypingMetrics
 * - computed: any (result from computeResults, may contain overall score)
 *
 * Returns an object { allowed: boolean, reason?: string }
 */
export function evaluatePassCriteria(
    lesson: CourseLesson | null,
    stats: TypingMetrics,
    computed: any,
): { allowed: boolean; reason?: string } {
    if (!lesson) {
        return { allowed: true, reason: "no-lesson" };
    }

    // Accept both new pass_criteria and older thresholds shape
    const pcRaw: any = (lesson as any).pass_criteria ?? null;

    // If no explicit criteria present, be permissive (allow)
    if (!pcRaw) {
        return { allowed: true, reason: "no-criteria-default-allow" };
    }

    const pc = pcRaw as any;

    // Interpret common aliases for min score key
    const minScore = pc.minScore;

    // If type is explicitly "completed", treat any finished run as pass
    if (pc.type === "completed") {
        return { allowed: true, reason: "completed-type" };
    }

    // If type is "performance", require checks (but skip any criteria with "auto")
    if (pc.type === "performance" || pc.type === undefined) {
        // accuracy check
        let accOk = true;
        if (
            pc.accuracy_percentage !== undefined &&
            pc.accuracy_percentage !== "auto"
        ) {
            const neededAcc = Number(pc.accuracy_percentage) || 0;
            accOk = stats.accuracy >= neededAcc;
        } else if (pc.minAccuracy !== undefined && pc.minAccuracy !== "auto") {
            const neededAcc = Number(pc.minAccuracy) || 0;
            accOk = stats.accuracy >= neededAcc;
        }

        // wpm check
        let wpmOk = true;
        if (pc.wpm !== undefined && pc.wpm !== "auto") {
            const neededWpm = Number(pc.wpm) || 0;
            wpmOk = stats.wpm >= neededWpm;
        } else if (pc.advanceScore !== undefined && pc.advanceScore !== "auto") {
            const neededWpm = Number(pc.advanceScore) || 0;
            wpmOk = stats.wpm >= neededWpm;
        }

        // min score check (if computed.score exists and a minScore is provided)
        let scoreOk = true;
        if (minScore !== undefined && minScore !== null && minScore !== "auto") {
            const neededScore = Number(minScore);
            if (
                !isNaN(neededScore) &&
                computed &&
                typeof computed.score === "number"
            ) {
                scoreOk = computed.score >= neededScore;
            }
        }

        const allowed = accOk && wpmOk && scoreOk;
        const reasons: string[] = [];
        if (!accOk) reasons.push("accuracy");
        if (!wpmOk) reasons.push("wpm");
        if (!scoreOk) reasons.push("score_min");
        return {
            allowed,
            reason: allowed ? "performance-pass" : `failed:${reasons.join(",")}`,
        };
    }

    return { allowed: true, reason: "unknown-type-default-allow" };
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

    // update mode-level progress
    const mm = { ...(modes[mode] || { runs: 0, bestWpm: 0, bestAcc: 0 }) };
    mm.runs = (mm.runs || 0) + 1;
    mm.bestWpm = Math.max(mm.bestWpm ?? 0, stats.wpm ?? 0);
    mm.bestAcc = Math.max(mm.bestAcc ?? 0, stats.accuracy ?? 0);
    modes[mode] = mm;

    // update lesson-level progress if course mode
    if (mode === "course" && courseLessonId) {
        const existing: LessonProgress = lessonsProg[courseLessonId] || {
            runs: 0,
            bestWpm: 0,
            bestAcc: 0,
            lastTime: null as string | null,
        };
        const lp = { ...existing };
        lp.runs = (lp.runs || 0) + 1;
        lp.bestWpm = Math.max(lp.bestWpm ?? 0, stats.wpm ?? 0);
        lp.bestAcc = Math.max(lp.bestAcc ?? 0, stats.accuracy ?? 0);
        lp.lastTime = new Date().toISOString();
        lessonsProg[courseLessonId] = lp;
    }

    return { modes, lessons: lessonsProg };
}
