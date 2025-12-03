import React from "react";
import keyboardLayout from "../config/keyboardLayout.json";

interface KeyboardLayoutProps {
  fingerInfo?: {
    baseKey: string | null;
    shift: boolean;
  };
}

// keyboard unit system (1u = standard key width)
const UNIT = "3.2rem";
const keyWidthMap: Record<string, string> = {
  Backspace: "4.8rem", // 1.5u
  Tab: "4.8rem", // 1.5u
  Caps: "5.7rem", // 1.75u
  Enter: "5.7rem", // 1.75u
  ShiftLeft: "7.4rem", // 2.25u
  ShiftRight: "7.4rem",
  Space: "19.25rem", // space bar
  CtrlLeft: "4rem",
  CtrlRight: "4rem",
  AltLeft: "4rem",
  AltRight: "4rem",
  MetaLeft: "4rem",
  MetaRight: "4rem",
  Menu: "4rem",
};

// keycap labels (SHIFT symbol on top, base below)
const keyLabels: Record<string, { top: string; bottom?: string }> = {
  "`": { top: "~", bottom: "`" },
  "1": { top: "!", bottom: "1" },
  "2": { top: "@", bottom: "2" },
  "3": { top: "#", bottom: "3" },
  "4": { top: "$", bottom: "4" },
  "5": { top: "%", bottom: "5" },
  "6": { top: "^", bottom: "6" },
  "7": { top: "&", bottom: "7" },
  "8": { top: "*", bottom: "8" },
  "9": { top: "(", bottom: "9" },
  "0": { top: ")", bottom: "0" },
  "-": { top: "_", bottom: "-" },
  "=": { top: "+", bottom: "=" },
  "[": { top: "{", bottom: "[" },
  "]": { top: "}", bottom: "]" },
  "\\": { top: "|", bottom: "\\" },
  ";": { top: ":", bottom: ";" },
  "'": { top: '"', bottom: "'" },
  ",": { top: "<", bottom: "," },
  ".": { top: ">", bottom: "." },
  "/": { top: "?", bottom: "/" },
};

const LEFT_HAND_KEYS = new Set([
  "`",
  "1",
  "2",
  "3",
  "4",
  "5",
  "q",
  "w",
  "e",
  "r",
  "t",
  "a",
  "s",
  "d",
  "f",
  "g",
  "z",
  "x",
  "c",
  "v",
  "b",
]);

const RIGHT_HAND_KEYS = new Set([
  "6",
  "7",
  "8",
  "9",
  "0",
  "-",
  "=",
  "y",
  "u",
  "i",
  "o",
  "p",
  "[",
  "]",
  "\\",
  "h",
  "j",
  "k",
  "l",
  ";",
  "'",
  "n",
  "m",
  ",",
  ".",
  "/",
]);
const specialKeySymbols: Record<string, string> = {
  Backspace: "⌫",
  Tab: "⇥",
  Caps: "⇪",
  Enter: "⏎",
  ShiftLeft: "⇧",
  ShiftRight: "⇧",
  CtrlLeft: "Ctrl",
  CtrlRight: "Ctrl",
  AltLeft: "Alt",
  AltRight: "Alt",
  MetaLeft: " ",
  MetaRight: " ",
  Menu: " ",
  Space: " ",
};

// Default labeling
function getLabel(k: string) {
  if (specialKeySymbols[k]) {
    return { bottom: specialKeySymbols[k], top: "" };
  }
  return keyLabels[k] ?? { bottom: k === "Space" ? "Space" : k.toUpperCase() };
}

const KeyboardLayout: React.FC<KeyboardLayoutProps> = ({ fingerInfo }) => {
  const activeKey = fingerInfo?.baseKey;
  const needsShift = !!fingerInfo?.shift;

  let useLeftShift = false;
  let useRightShift = false;

  if (needsShift && activeKey) {
    if (LEFT_HAND_KEYS.has(activeKey)) {
      useRightShift = true;
    } else if (RIGHT_HAND_KEYS.has(activeKey)) {
      useLeftShift = true;
    } else {
      useLeftShift = true;
      useRightShift = true;
    }
  }

  return (
    <div className="mt-6 flex justify-center">
      <div className="inline-block rounded-xl border border-slate-800 bg-slate-950 p-3">
        {keyboardLayout.rows.map((row, i) => (
          <div key={i} className="flex mb-1">
            {row.map((k) => {
              const isShiftLeft = k === "ShiftLeft";
              const isShiftRight = k === "ShiftRight";
              const isSpace = k === "Space";
              const isEnter = k === "Enter";
              const isTab = k === "Tab";

              const label = getLabel(k);
              const width = keyWidthMap[k] ?? UNIT;

              const isActiveBase =
                (isSpace && activeKey === " ") ||
                (isEnter && activeKey == "Enter") ||
                (isTab && activeKey == "Tab") ||
                (!isShiftLeft &&
                  !isShiftRight &&
                  k.length === 1 &&
                  k === activeKey);

              // Choose highlight per key
              let colorClasses: string;
              if (isShiftLeft && useLeftShift) {
                colorClasses = "bg-emerald-800 border-emerald-400";
              } else if (isShiftRight && useRightShift) {
                colorClasses = "bg-emerald-800 border-emerald-400";
              } else if (isActiveBase) {
                colorClasses = "bg-emerald-800 border-emerald-400";
              } else {
                colorClasses = "bg-slate-900 border-slate-700";
              }

              return (
                <div
                  key={k}
                  style={{ width }}
                  className={`h-[3.2rem] mx-[1px] flex items-center justify-center select-none rounded-md border text-white text-xs ${colorClasses}`}
                >
                  <div className="relative w-full h-full">
                    {/* Top-left (shift symbol or top glyph) */}
                    <span className="absolute top-[4px] left-[5px] text-[10px] leading-none">
                      {label.top}
                    </span>

                    {/* Centered base key */}
                    {label.bottom && (
                      <span className="absolute inset-0 flex items-center justify-center text-[12px] leading-none">
                        {label.bottom}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

export default KeyboardLayout;
