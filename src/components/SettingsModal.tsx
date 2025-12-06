// src/components/SettingsModal.tsx
import React from "react";
import { PiSpeakerHighFill } from "react-icons/pi";
import {
  playTypingSound,
  playErrorSound,
  setSoundConfig,
} from "../utils/sounds";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;

  showKeyboard: boolean;
  onToggleKeyboard: (value: boolean) => void;

  preventBackspace: boolean;
  onTogglePreventBackspace: (value: boolean) => void;

  fontFamily: string;
  onChangeFontFamily: (value: string) => void;

  fontSize: string;
  onChangeFontSize: (value: string) => void;

  enableSounds: boolean;
  onToggleSounds: (value: boolean) => void;

  typingVolume: number;
  onChangeTypingVolume: (value: number) => void;

  errorVolume: number;
  onChangeErrorVolume: (value: number) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onClose,
  showKeyboard,
  onToggleKeyboard,
  preventBackspace,
  onTogglePreventBackspace,
  fontFamily,
  onChangeFontFamily,
  fontSize,
  onChangeFontSize,
  enableSounds,
  onToggleSounds,
  typingVolume,
  onChangeTypingVolume,
  errorVolume,
  onChangeErrorVolume,
}) => {
  if (!open) return null;

  // --- MINIMAL TOGGLE COMPONENT ---
  const MinimalToggle = ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors
                 focus:outline-none
                 bg-slate-700/80
                 data-[on=true]:bg-emerald-500/80"
      data-on={checked}
    >
      <span
        className={[
          "h-4 w-4 rounded-full bg-slate-900 shadow transform transition-transform duration-200",
          checked ? "translate-x-4" : "translate-x-1",
        ].join(" ")}
      />
    </button>
  );

  // --- SOUND WRAPPERS ---
  const applyTypingVolume = (v: number) => {
    onChangeTypingVolume(v);
    setSoundConfig({ typingVolume: v / 100 });
  };

  const applyErrorVolume = (v: number) => {
    onChangeErrorVolume(v);
    setSoundConfig({ errorVolume: v / 100 });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-950/95 px-4 py-4 shadow-2xl text-sm text-slate-100">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Settings</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            ✕
          </button>
        </div>

        {/* SETTINGS GROUP */}
        <div className="space-y-2">
          {/* Keyboard toggle */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">
            <div>
              <div className="font-medium text-slate-100 text-xs">
                On-screen keyboard
              </div>
              <div className="text-[11px] text-slate-400">
                Show a visual keyboard with key hints.
              </div>
            </div>
            <MinimalToggle checked={showKeyboard} onChange={onToggleKeyboard} />
          </div>

          {/* Prevent Backspace */}
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">
            <div>
              <div className="font-medium text-slate-100 text-xs">
                Prevent Backspace
              </div>
              <div className="text-[11px] text-slate-400">
                Disable correcting mistakes.
              </div>
            </div>
            <MinimalToggle
              checked={preventBackspace}
              onChange={(v) => onTogglePreventBackspace(v)}
            />
          </div>

          {/* SOUND GROUP */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-100 text-xs">
                  Enable sounds
                </div>
                <div className="text-[11px] text-slate-400">
                  Typing and error sounds.
                </div>
              </div>

              <MinimalToggle
                checked={enableSounds}
                onChange={(v) => onToggleSounds(v)}
              />
            </div>

            {/* Animated slider container */}
            <div
              className={[
                "overflow-hidden transform transition-all duration-200",
                enableSounds
                  ? "mt-3 max-h-60 opacity-100 translate-y-0"
                  : "max-h-0 opacity-0 -translate-y-1",
              ].join(" ")}
            >
              <div className="space-y-3 pb-1 pl-1 pr-1">
                {/* Typing volume */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] text-slate-300 font-medium">
                      Typing
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Key press level
                    </div>
                  </div>

                  <div className="flex-1 ml-3 flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={typingVolume}
                      onChange={(e) =>
                        applyTypingVolume(Number(e.target.value))
                      }
                      className="mt-3 w-full"
                    />
                    <button
                      onClick={() => playTypingSound()}
                      className="rounded bg-slate-800/40 hover:bg-slate-800/60 p-1"
                    >
                      <PiSpeakerHighFill size={14} />
                    </button>
                  </div>
                </div>

                {/* Error volume */}
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] text-slate-300 font-medium">
                      Error
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Wrong key level
                    </div>
                  </div>

                  <div className="flex-1 ml-3 flex items-center gap-3">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={errorVolume}
                      onChange={(e) => applyErrorVolume(Number(e.target.value))}
                      className="mt-3 w-full"
                    />
                    <button
                      onClick={() => playErrorSound()}
                      className="rounded bg-slate-800/40 hover:bg-slate-800/60 p-1"
                    >
                      <PiSpeakerHighFill size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fonts */}
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">
            <div>
              <div className="font-medium text-slate-100 text-xs">Font</div>
              <div className="text-[11px] text-slate-400">
                Practice text font.
              </div>
            </div>
            <select
              value={fontFamily}
              onChange={(e) => onChangeFontFamily(e.target.value)}
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px]"
            >
              <option value="default">Default</option>
              <option value="anek">Anek</option>
              <option value="chilanka">Chilanka</option>
              <option value="manjari">Manjari</option>
            </select>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2">
            <div>
              <div className="font-medium text-slate-100 text-xs">
                Font size
              </div>
              <div className="text-[11px] text-slate-400">
                Adjust text size.
              </div>
            </div>
            <select
              value={fontSize}
              onChange={(e) => onChangeFontSize(e.target.value)}
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px]"
            >
              <option value="text-base">Small</option>
              <option value="text-lg">Medium</option>
              <option value="text-xl">Large</option>
              <option value="text-2xl">Extra large</option>
            </select>
          </div>
        </div>

        {/* Hint */}
        <div className="mt-3 text-[11px] text-slate-500">
          Press <span className="text-slate-300 font-medium">Esc</span> anytime
          to return.
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
