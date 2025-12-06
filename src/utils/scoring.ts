import type { TypingMetrics } from "./metrics";

/**
 * Compute a normalized score 0-100 using metrics.
 *
 * We use these inputs (numbers):
 * - wpm: effective words per minute (float)
 * - rawWpm: raw wpm (float)
 * - accuracy: 0-100
 * - missing: number of placeholders / missed strokes
 *
 * Returns object { score, parts } for UI breakdown.
 */

const WPM_CAP = 100; // anything above caps to avoid domination
const RAW_WPM_CAP = 120;

export function clamp01(v: number) {
    return Math.max(0, Math.min(1, v));
}

export function normalizeTo01(value: number, cap: number) {
    return clamp01(value / cap);
}

export function computeLessonScore(
    stats: TypingMetrics,
    opts?: {
        weights?: {
            wpm?: number;
            rawWpm?: number;
            acc?: number;
            completeness?: number;
        };
        missingCap?: number;
        caps?: { wpm?: number; rawWpm?: number };
    },
) {
    const weights = opts?.weights ?? {
        wpm: 0.35,
        rawWpm: 0.2,
        acc: 0.35,
        completeness: 0.1,
    };
    const caps = opts?.caps ?? { wpm: WPM_CAP, rawWpm: RAW_WPM_CAP };
    const missingCap = opts?.missingCap ?? 10;

    const wpm01 = normalizeTo01(stats.wpm, caps.wpm ?? 100);
    const raw01 = normalizeTo01(stats.rawWpm, caps.rawWpm ?? 120);
    const acc01 = clamp01(stats.accuracy / 100);

    // completeness score: fewer missing placeholders is better
    // missingNormalized = 1 when missing == 0, 0 when missing >= missingCap
    const missing = stats.missed ?? 0;
    const completeness01 = clamp01(1 - missing / missingCap);

    const combined01 =
        wpm01 * (weights.wpm ?? 0) +
        raw01 * (weights.rawWpm ?? 0) +
        acc01 * (weights.acc ?? 0) +
        completeness01 * (weights.completeness ?? 0);

    const score = Math.round(combined01 * 100);

    return {
        score,
        parts: {
            wpmScore: Math.round(wpm01 * 100),
            rawScore: Math.round(raw01 * 100),
            accScore: Math.round(acc01 * 100),
            completenessScore: Math.round(completeness01 * 100),
            missing,
        },
    };
}

/**
 * Decide whether the user can advance to next lesson.
 * Default rules:
 * - score >= advanceThreshold
 * - accuracy >= minAccuracy
 * - missing <= maxMissing
 */
export function canAdvanceLesson(
    stats: TypingMetrics,
    computed: ReturnType<typeof computeLessonScore>,
    opts?: {
        advanceThreshold?: number;
        minAccuracy?: number;
        maxMissing?: number;
        minRawWpm?: number;
    },
) {
    const advanceThreshold = opts?.advanceThreshold ?? 75;
    const minAccuracy = opts?.minAccuracy ?? 85;
    const maxMissing = opts?.maxMissing ?? 3;
    const minRawWpm = opts?.minRawWpm ?? 6;

    const passScore = computed.score >= advanceThreshold;
    const passAcc = stats.accuracy >= minAccuracy;
    const passMissing = (computed.parts.missing ?? 0) <= maxMissing;
    const passRaw = stats.rawWpm >= minRawWpm;

    return {
        allowed: passScore && passAcc && passMissing && passRaw,
        reasons: {
            passScore,
            passAcc,
            passMissing,
            passRaw,
            score: computed.score,
        },
    };
}
