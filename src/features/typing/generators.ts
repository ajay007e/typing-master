// src/features/typing/generators.ts
import { COMMON_WORDS } from "./constants";

/**
 * Build a sequence of characters using selected letters with occasional spaces
 * (used by "letters" practice mode).
 */
export function buildLetterString(selectedLetters: string[], length: number) {
    if (!selectedLetters.length) return "";
    let result = "";
    for (let i = 0; i < length; i++) {
        const idx = Math.floor(Math.random() * selectedLetters.length);
        result += selectedLetters[idx];
        if ((i + 1) % 4 === 0 && i !== length - 1) result += " ";
    }
    return result;
}

/**
 * Build a fake paragraph made of common words (used by "common words" mode).
 */
export function buildCommonParagraph(totalWords: number) {
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
