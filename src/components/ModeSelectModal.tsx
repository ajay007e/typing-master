import React from "react";
import type { AppConfig } from "../utils/types";
import ModeCards from "./ModeCards";

interface ModeMeta {
  id: AppConfig["mode"];
  label: string;
  description: string;
  icon: "keyboard" | "document" | "stats" | "graduation";
}

interface ModeSelectModalProps {
  open: boolean;
  onClose: () => void;
  modes: ModeMeta[];
  selectedModeId: AppConfig["mode"];
  onSelectMode: (id: AppConfig["mode"]) => void;
}

const ModeSelectModal: React.FC<ModeSelectModalProps> = ({
  open,
  onClose,
  modes,
  selectedModeId,
  onSelectMode,
}) => {
  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
            Choose a mode
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            ✕
          </button>
        </div>

        {/* Your existing cards, now inside a modal */}
        <ModeCards
          modes={modes}
          selectedModeId={selectedModeId}
          onSelectMode={onSelectMode}
        />
      </div>
    </div>
  );
};

export default ModeSelectModal;
