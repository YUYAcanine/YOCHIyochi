"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ListFilter, Menu, Check } from "lucide-react";

/* ===== 離乳期フェーズ一覧 ===== */
export const PHASES = [
  "離乳初期",
  "離乳中期",
  "離乳後期",
  "離乳完了期",
  "幼児期",
] as const;
export type Phase = typeof PHASES[number];

/* ===== Context 型定義 ===== */
type ChecklistContextType = {
  open: boolean;
  setOpen: (v: boolean) => void;
  phase: Phase | null;
  setPhase: (p: Phase | null) => void;
};

/* ===== Context作成 ===== */
const ChecklistContext = createContext<ChecklistContextType | null>(null);

/* ===== Provider ===== */
export function ChecklistProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase | null>(null);
  const value = useMemo(() => ({ open, setOpen, phase, setPhase }), [open, phase]);
  return <ChecklistContext.Provider value={value}>{children}</ChecklistContext.Provider>;
}

/* ===== Hook ===== */
export function useChecklist() {
  const ctx = useContext(ChecklistContext);
  if (!ctx) throw new Error("useChecklist must be used within ChecklistProvider");
  return ctx;
}

/* ===== 右上ボタン ===== */
export function ChecklistButton() {
  const { open, setOpen, phase } = useChecklist();
  const toggle = useCallback(() => setOpen(!open), [open, setOpen]);
  return (
    <button
      aria-label={open ? "Close checklist" : "Open checklist"}
      onClick={toggle}
      className="fixed top-3 right-3 z-50 rounded-2xl border border-neutral-200 bg-white/80 backdrop-blur px-3 py-2 shadow-sm hover:shadow transition flex items-center gap-2"
    >
      <Menu className="h-5 w-5" />
      <span className="hidden sm:inline text-sm font-medium">{phase ?? "チェック"}</span>
    </button>
  );
}

/* ===== チェックリストパネル ===== */
export function ChecklistPanel() {
  const { open, setOpen, phase, setPhase } = useChecklist();
  const [query, setQuery] = useState("");
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (!open) return;
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, setOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  const filtered = PHASES.filter((p) => p.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/20"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.aside
            key="checklist-panel"
            ref={panelRef}
            initial={{ opacity: 0, x: 24, y: -24, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, y: -24, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className="fixed top-14 right-3 z-50 w-[min(92vw,22rem)] origin-top-right"
          >
            <div className="rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden">
              <div className="flex items-start justify-between p-4 sm:p-5">
                <h2 className="text-lg sm:text-xl font-semibold tracking-tight">チェックリスト</h2>
                <button
                  aria-label="Close"
                  onClick={() => setOpen(false)}
                  className="rounded-xl p-2 hover:bg-neutral-100 active:scale-95 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-4 sm:px-5 pb-3">
                <div className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2">
                  <ListFilter className="h-4 w-4" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="フェーズ名でフィルタ"
                    className="w-full outline-none text-sm"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      className="text-xs text-neutral-500 hover:underline"
                    >
                      クリア
                    </button>
                  )}
                </div>
              </div>

              <ul className="max-h-[60vh] overflow-auto px-2 sm:px-3 pb-3">
                {filtered.length === 0 && (
                  <li className="p-4 text-sm text-neutral-500">該当なし</li>
                )}
                {filtered.map((p) => (
                  <li key={p} className="p-1">
                    <button
                      onClick={() => {
                        setPhase(p);
                        setOpen(false);
                      }}
                      className="w-full text-left"
                    >
                      <div className="group w-full flex items-center justify-between gap-3 rounded-xl border border-transparent hover:border-neutral-200 bg-white hover:bg-neutral-50 px-3 py-3 transition shadow-sm">
                        <span className="truncate font-medium">{p}</span>
                        {phase === p && <Check className="h-4 w-4" />}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
