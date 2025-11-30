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

    let correct = 0;
    let incorrect = 0;

    const minLen = Math.min(targetText.length, typedText.length);
    for (let i = 0; i < minLen; i++) {
        if (typedText[i] === targetText[i]) correct++;
        else incorrect++;
    }

    const extra =
        typedText.length > targetText.length
            ? typedText.length - targetText.length
            : 0;

    const missed =
        targetText.length > typedText.length
            ? targetText.length - typedText.length
            : 0;

    const totalTyped = typedText.length;

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
