import { getGraphemes } from "./malayalam";
import { getKeyStrokesForGrapheme } from "./keystrokes";
import type { KeyStroke } from "./keystrokes";

export const PLACEHOLDER = "•"; // use the same char wherever you add placeholders
export interface GraphemeInfo {
    grapheme: string;
    keystrokes: KeyStroke[];
}

export function buildGraphemeInfos(text: string): GraphemeInfo[] {
    const graphemes = getGraphemes(text);
    return graphemes.map((g) => ({
        grapheme: g,
        keystrokes: getKeyStrokesForGrapheme(g),
    }));
}

export function getTypingProgress(
    graphemes: GraphemeInfo[],
    totalTypedUnits: number,
) {
    let remaining = totalTypedUnits;
    let charIndex = 0;

    while (charIndex < graphemes.length) {
        const strokeCount = graphemes[charIndex].keystrokes.length || 1;

        if (remaining < strokeCount) {
            return {
                charIndex,
                strokeIndex: remaining,
            };
        }

        remaining -= strokeCount;
        charIndex++;
    }

    return {
        charIndex: graphemes.length,
        strokeIndex: 0,
    };
}
