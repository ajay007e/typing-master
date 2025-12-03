import { getGraphemes } from "./malayalam";

export interface TypingMetrics {
    durationMs: number;
    wpm: number;
    rawWpm: number;
    accuracy: number;
    correct: number;
    incorrect: number;
    extra: number;
    missed: number;
    totalTyped: number;
}

export function calculateTypingMetrics(
    targetText: string,
    typedText: string,
    durationMs: number,
): TypingMetrics {
    const safeDurationMs = Math.max(durationMs, 1);
    const minutes = safeDurationMs / 60000;

    const target = getGraphemes(targetText);
    const typed = getGraphemes(typedText);

    let correct = 0;
    let incorrect = 0;

    const minLen = Math.min(target.length, typed.length);

    for (let i = 0; i < minLen; i++) {
        if (typed[i] === target[i]) correct++;
        else incorrect++;
    }

    const extra = typed.length > target.length ? typed.length - target.length : 0;

    const missed =
        target.length > typed.length ? target.length - typed.length : 0;

    const totalTyped = typed.length;

    const rawWpm = totalTyped / 5 / minutes;
    const wpm = correct / 5 / minutes;

    const accuracy = totalTyped > 0 ? (correct / totalTyped) * 100 : 0;

    return {
        durationMs: safeDurationMs,
        wpm,
        rawWpm,
        accuracy,
        correct,
        incorrect,
        extra,
        missed,
        totalTyped,
    };
}
