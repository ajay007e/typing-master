import { getGraphemes, normalizeMalayalam } from "./malayalam";
import { buildGraphemeInfos } from "./typingModel";
import type { GraphemeInfo } from "./typingModel";
import { PLACEHOLDER } from "./typingModel";

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

    const graphemeInfos: GraphemeInfo[] = buildGraphemeInfos(targetText);

    let correct = 0;
    let incorrect = 0;
    let missed = 0;
    let extraGraphemes = 0;

    let pos = 0;
    for (let i = 0; i < graphemeInfos.length; i++) {
        const info = graphemeInfos[i];
        const strokesNeeded = info.keystrokes.length || 1;

        const end = Math.min(typedText.length, pos + strokesNeeded);
        const chunk = typedText.slice(pos, end); // may include placeholders
        pos += strokesNeeded;

        const visible = chunk.split(PLACEHOLDER).join("");

        const normTarget = normalizeMalayalam(info.grapheme);
        const normTyped = normalizeMalayalam(visible);

        if (!chunk.length) {
            missed++;
            continue;
        }

        if (normTyped === normTarget) {
            correct++;
        } else {
            incorrect++;
        }
    }

    if (pos < typedText.length) {
        const leftover = typedText.slice(pos);
        const extraVisible = leftover.split(PLACEHOLDER).join("");
        extraGraphemes = getGraphemes(extraVisible).length;
    }

    const totalTypedGraphemes = correct + incorrect + extraGraphemes;

    const rawWpm = totalTypedGraphemes / 5 / minutes;
    const wpm = correct / 5 / minutes;
    const accuracy =
        totalTypedGraphemes > 0 ? (correct / totalTypedGraphemes) * 100 : 0;

    return {
        durationMs: safeDurationMs,
        wpm,
        rawWpm,
        accuracy,
        correct,
        incorrect,
        extra: extraGraphemes,
        missed,
        totalTyped: totalTypedGraphemes,
    };
}
