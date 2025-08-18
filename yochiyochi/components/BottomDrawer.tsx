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
      <div className="mx-auto max-w-3xl rounded-t-2xl border border-zinc-200 bg-white shadow-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-zinc-500">
            選択テキスト：<span className="font-medium text-zinc-800">{openText}</span>
          </div>
          <button
            type="button"
            className="px-3 py-1 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
            onClick={onClose}
          >
            閉じる
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
