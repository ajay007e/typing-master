import malInscriptMap from "../config/malInscriptMap.json";
import fingerMap from "../config/fingerMap.json";

export interface FingerInfo {
    finger: string | null;
    displayKey: string | null; // label like "` ~" or ", <"
    baseKey: string | null; // raw key: "k", ",", " "
    shift: boolean;
}

export function getFingerInfoForChar(ch: string | undefined): FingerInfo {
    if (!ch)
        return { finger: null, displayKey: null, baseKey: null, shift: false };

    const fm = fingerMap as Record<string, string>;
    const insMap = malInscriptMap as Record<
        string,
        { key: string; shift: boolean }
    >;

    // Space bar
    if (ch === " ") {
        return {
            finger: fm[" "] || "Thumbs (space bar)",
            displayKey: "Space",
            baseKey: " ",
            shift: false,
        };
    }

    const entry = insMap[ch];
    const key = entry ? entry.key : ch; // physical key
    const shift = entry ? entry.shift : false;
    const base = key.toLowerCase();
    const finger = fm[base] || null;

    let displayKey = key.toUpperCase();
    if (base === "`") displayKey = "` ~";
    if (base === "[") displayKey = "[ {";
    if (base === "]") displayKey = "] }";
    if (base === ";") displayKey = "; :";
    if (base === "'") displayKey = "' \"";
    if (base === ",") displayKey = ", <";
    if (base === ".") displayKey = ". >";
    if (base === "=") displayKey = "= +";

    return {
        finger,
        displayKey,
        baseKey: base,
        shift,
    };
}
