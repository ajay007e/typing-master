import React from "react";

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;

  showKeyboard: boolean;
  onToggleKeyboard: (value: boolean) => void;

  preventBackspace: boolean;
  onTogglePreventBackspace: (value: boolean) => void;

  theme: "light" | "dark";
  onToggleTheme: () => void;

  fontFamily: string;
  onChangeFontFamily: (value: string) => void;

  fontSize: string;
  onChangeFontSize: (value: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onClose,
  showKeyboard,
  onToggleKeyboard,
  preventBackspace,
  onTogglePreventBackspace,
  theme,
  onToggleTheme,
  fontFamily,
  onChangeFontFamily,
  fontSize,
  onChangeFontSize,
}) => {
  if (!open) return null;

  const Toggle = ({
    label,
    description,
    checked,
    onChange,
  }: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (val: boolean) => void;
  }) => (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-left text-xs transition hover:border-slate-700 hover:bg-slate-900/90"
    >
      <div className="pr-2">
        <div className="font-medium text-slate-100">{label}</div>
        <div className="mt-0.5 text-[11px] text-slate-400">{description}</div>
      </div>
      <span
        className={[
          "inline-flex h-4 w-7 items-center rounded-full border px-[2px] text-[0]",
          checked
            ? "border-emerald-400 bg-emerald-500/90"
            : "border-slate-500 bg-slate-700",
        ].join(" ")}
      >
        <span
          className={[
            "h-3 w-3 rounded-full bg-slate-900 shadow-sm transition-transform",
            checked ? "translate-x-3" : "translate-x-0",
          ].join(" ")}
        />
      </span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-950/95 px-4 py-4 text-sm text-slate-100 shadow-2xl">
        {/* Header */}
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        {/* Main switches */}
        <div className="space-y-2">
          <Toggle
            label="On-screen keyboard"
            description="Show a visual keyboard with key hints while typing."
            checked={showKeyboard}
            onChange={onToggleKeyboard}
          />

          <Toggle
            label="Prevent Backspace"
            description="Disable backspace during tests to avoid correcting mistakes."
            checked={preventBackspace}
            onChange={onTogglePreventBackspace}
          />

          <Toggle
            label="Theme"
            description={
              theme === "dark"
                ? "Dark mode is currently enabled."
                : "Light mode is currently enabled."
            }
            checked={theme === "dark"}
            onChange={onToggleTheme}
          />
        </div>

        {/* Font controls styled like toggles */}
        <div className="mt-3 space-y-2">
          {/* Font family card */}
          <div className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs">
            <div className="pr-2">
              <div className="font-medium text-slate-100">Font</div>
              <div className="mt-0.5 text-[11px] text-slate-400">
                Choose the typeface used in the practice text.
              </div>
            </div>
            <select
              value={fontFamily}
              onChange={(e) => onChangeFontFamily(e.target.value)}
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100
                         focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="default">Default</option>
              <option value="anek">Anek</option>
              <option value="chilanka">Chilanka</option>
              <option value="manjari">Manjari</option>
            </select>
          </div>

          {/* Font size card */}
          <div className="flex w-full items-center justify-between rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs">
            <div className="pr-2">
              <div className="font-medium text-slate-100">Font size</div>
              <div className="mt-0.5 text-[11px] text-slate-400">
                Adjust how large the practice text appears.
              </div>
            </div>
            <select
              value={fontSize}
              onChange={(e) => onChangeFontSize(e.target.value)}
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] text-slate-100
                         focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
          Press <span className="font-medium text-slate-200">Esc</span> during a
          test to return to settings.
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
