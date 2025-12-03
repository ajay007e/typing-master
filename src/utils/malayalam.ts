export function normalizeMalayalam(str: string) {
    if (!str) return "";

    let s = str.normalize("NFC");

    s = s
        .replace(/\u0D23\u0D4D\u200D/g, "\u0D7A")
        .replace(/\u0D28\u0D4D\u200D/g, "\u0D7B")
        .replace(/\u0D30\u0D4D\u200D/g, "\u0D7C")
        .replace(/\u0D32\u0D4D\u200D/g, "\u0D7D")
        .replace(/\u0D33\u0D4D\u200D/g, "\u0D7E")
        .replace(/\u0D15\u0D4D\u200D/g, "\u0D7F");
    return s;
}

const segmenter = new Intl.Segmenter("ml", { granularity: "grapheme" });

export function getGraphemes(str: string): string[] {
    const normalized = normalizeMalayalam(str);
    return [...segmenter.segment(normalized)].map((s) => s.segment);
}

export function isMalayalamChar(ch: string): boolean {
    if (!ch) return false;

    const code = ch.codePointAt(0);
    if (!code) return false;

    return code >= 0x0d00 && code <= 0x0d7f;
}
