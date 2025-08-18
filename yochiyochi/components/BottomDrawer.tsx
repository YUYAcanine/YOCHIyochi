// components/BottomDrawer.tsx
"use client";
import * as React from "react";
import PhaseDescriptionBox from "@/components/PhaseDescriptionBox";
import type { PhaseKey } from "@/types/food";

type Variant = "forbidden" | "ok" | "none";

type Props = {
  openText: string;
  description: string;
  phase: PhaseKey;
  variant: Variant;
  onClose: () => void;
};

export default function BottomDrawer({
  openText,
  description,
  phase,
  variant,
  onClose,
}: Props) {
  const open = !!openText && !!description && variant !== "none";

  return (
    <aside
      className={`fixed left-0 right-0 bottom-0 z-40 transform transition-transform duration-300 ${
        open ? "translate-y-0" : "translate-y-full"
      }`}
      role="dialog"
      aria-label="説明"
    >
      {/* ▼ 背景色をうすい彩度低めのピンクに変更 */}
      <div className="mx-auto max-w-3xl rounded-t-2xl border border-zinc-200 bg-[#F8E8E8] shadow-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          {/* ▼ ラベルを“食材名”に変更 */}
          <div className="text-sm text-zinc-700">
            食材名：<span className="font-medium text-zinc-900">{openText}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-lg
                       bg-[#5C3A2E] hover:bg-[#6E4B3F] text-white text-2xl font-bold transition"
            aria-label="閉じる"
          >
            ×
          </button>
        </div>

        <PhaseDescriptionBox
          description={description}
          phase={phase}
          variant={variant}
        />
      </div>
    </aside>
  );
}
