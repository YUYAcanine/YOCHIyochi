// components/checklist.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

/* ---------- 型と定数 ---------- */
export type PhaseKey = "phase1" | "phase2" | "phase3" | "phase4";

export const PHASE_LABELS: Record<PhaseKey, string> = {
  phase1: "離乳初期",
  phase2: "離乳中期",
  phase3: "離乳後期",
  phase4: "完了期",
};

const PHASE_ITEMS: { key: PhaseKey; label: string; sub?: string }[] = [
  { key: "phase1", label: "離乳初期", sub: "5〜6か月目安 / とろとろ" },
  { key: "phase2", label: "離乳中期", sub: "7〜8か月目安 / どろ〜形が残る" },
  { key: "phase3", label: "離乳後期", sub: "9〜11か月目安 / みじん・手づかみ" },
  { key: "phase4", label: "完了期", sub: "12〜18か月目安 / 普通食へ移行" },
];

/* ---------- Storage helper ---------- */
const STORAGE_KEY = "checklistPhase";
function safeGetPhase(): PhaseKey {
  if (typeof window === "undefined") return "phase1";
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw === "phase2" || raw === "phase3" || raw === "phase4") return raw;
  return "phase1";
}
function safeSetPhase(p: PhaseKey) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, p);
}

/* ---------- Context ---------- */
type ChecklistContextType = {
  phase: PhaseKey;
  setPhase: (p: PhaseKey) => void;
  open: boolean;
  setOpen: (o: boolean) => void;
};

const ChecklistContext = createContext<ChecklistContextType | undefined>(undefined);

/* ---------- Provider ---------- */
export function ChecklistProvider({ children }: { children: React.ReactNode }) {
  const [phase, setPhaseState] = useState<PhaseKey>("phase1"); // ← SSR用に固定
  const [open, setOpen] = useState<boolean>(false);

  // マウント後に localStorage の値を反映
  useEffect(() => {
    setPhaseState(safeGetPhase());
  }, []);

  const setPhase = (p: PhaseKey) => {
    setPhaseState(p);
    safeSetPhase(p);
  };

  // 他タブ更新への追従
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setPhaseState(safeGetPhase());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo(() => ({ phase, setPhase, open, setOpen }), [phase, open]);
  return <ChecklistContext.Provider value={value}>{children}</ChecklistContext.Provider>;
}
/* ---------- Hook ---------- */
export function useChecklist() {
  const ctx = useContext(ChecklistContext);
  if (!ctx) throw new Error("useChecklist must be used inside ChecklistProvider");
  return ctx;
}

/* ---------- 右上固定ボタン ---------- */
export function ChecklistButton() {
  const { open, setOpen } = useChecklist();
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className="fixed top-4 right-4 z-50 px-3 py-2 rounded-lg bg-purple-600 text-white shadow hover:bg-purple-700 transition"
      aria-haspopup="dialog"
      aria-expanded={open}
      aria-controls="checklist-drawer"
    >
      チェックリスト
    </button>
  );
}

/* ---------- 右スライドドロワー + 外クリック/選択で閉じる ---------- */
export function ChecklistPanel() {
  const { phase, setPhase, open, setOpen } = useChecklist();
  const heading = useMemo(() => `チェックリスト（現在：${PHASE_LABELS[phase]}）`, [phase]);

  const onBackdropClick: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if ((e.target as HTMLElement).dataset?.backdrop === "true") {
      setOpen(false);
    }
  };
  const onSelect = (key: PhaseKey) => {
    setPhase(key);
    setOpen(false);
  };

  return (
    <>
      <div
        data-backdrop="true"
        onClick={onBackdropClick}
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-200 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden={!open}
      />
      <aside
        id="checklist-drawer"
        role="dialog"
        aria-label={heading}
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-zinc-200">
          <h3 className="text-lg font-semibold text-purple-800">{heading}</h3>
          <p className="text-xs text-zinc-500 mt-1">
            表示する乳幼児の段階を選択してください。
          </p>
        </div>
        <div className="p-4 overflow-y-auto h-[calc(100%-3.5rem)]">
          {PHASE_ITEMS.map((item) => (
            <label
              key={item.key}
              className="flex items-start gap-3 rounded-xl border border-zinc-200 p-3 hover:bg-zinc-50 mb-2 cursor-pointer"
              onClick={() => onSelect(item.key)}
            >
              <input
                type="radio"
                name="weaning-phase"
                value={item.key}
                checked={phase === item.key}
                onChange={() => onSelect(item.key)}
                className="mt-1"
              />
              <div>
                <div className="font-medium">
                  {item.label}
                  <span className="ml-2 text-xs text-zinc-500">{item.sub}</span>
                </div>
              </div>
            </label>
          ))}
        </div>
      </aside>
    </>
  );
}


