import keystrokesConfig from "../config/malInscriptMap.json";

export interface KeyStroke {
    key: string;
    shift: boolean;
}

interface CharMapping extends KeyStroke {
    post?: KeyStroke[];
}

const KEYSTROKE_MAP = keystrokesConfig as Record<string, CharMapping>;

function getKeyStrokesForChar(ch: string): KeyStroke[] {
    const mapping = KEYSTROKE_MAP[ch];
    if (!mapping) return [];

    const strokes: KeyStroke[] = [{ key: mapping.key, shift: mapping.shift }];

    if (mapping.post && mapping.post.length) {
        strokes.push(...mapping.post);
    }

    return strokes;
}

export function getKeyStrokesForGrapheme(grapheme: string): KeyStroke[] {
    const direct = getKeyStrokesForChar(grapheme);
    if (direct.length) return direct;
    const result: KeyStroke[] = [];
    for (const ch of Array.from(grapheme)) {
        const strokes = getKeyStrokesForChar(ch);
        result.push(...strokes);
    }
    return result;
}

export const KEY_TO_CODE: Record<string, string> = {
    a: "KeyA",
    b: "KeyB",
    c: "KeyC",
    d: "KeyD",
    e: "KeyE",
    f: "KeyF",
    g: "KeyG",
    h: "KeyH",
    i: "KeyI",
    j: "KeyJ",
    k: "KeyK",
    l: "KeyL",
    m: "KeyM",
    n: "KeyN",
    o: "KeyO",
    p: "KeyP",
    q: "KeyQ",
    r: "KeyR",
    s: "KeyS",
    t: "KeyT",
    u: "KeyU",
    v: "KeyV",
    w: "KeyW",
    x: "KeyX",
    y: "KeyY",
    z: "KeyZ",
    "1": "Digit1",
    "2": "Digit2",
    "3": "Digit3",
    "4": "Digit4",
    "5": "Digit5",
    "6": "Digit6",
    "7": "Digit7",
    "8": "Digit8",
    "9": "Digit9",
    "0": "Digit0",
    "-": "Minus",
    "=": "Equal",
    "`": "Backquote",
    "[": "BracketLeft",
    "]": "BracketRight",
    "\\": "Backslash",
    ";": "Semicolon",
    "'": "Quote",
    ",": "Comma",
    ".": "Period",
    "/": "Slash",
    " ": "Space",
    Enter: "Enter",
    Tab: "Tab",
};
