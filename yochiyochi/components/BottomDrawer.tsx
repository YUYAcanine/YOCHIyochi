// components/BottomDrawer.tsx
"use client";
import React from "react";
import PhaseDescriptionBox from "@/components/PhaseDescriptionBox";
import { PHASE_LABELS } from "@/components/checklist";
import type { PhaseKey } from "@/types/food";

const chipBg: Record<PhaseKey, string> = {
  phase1: "#3b82f622",
  phase2: "#22c55e22",
  phase3: "#f59e0b22",
  phase4: "#ec489922",
};

type Props = {
  openText: string;
  description: string;
  phase: PhaseKey;
  onClose: () => void;
};

export default function BottomDrawer({ openText, description, phase, onClose }: Props) {
  const open = !!openText;
  return (
    <div
      role="dialog"
      aria-hidden={open ? "false" : "true"}
      aria-label="料理の説明"
      className={`fixed inset-x-0 bottom-0 z-30 transform transition-transform duration-300 ${
        open ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="relative bg-white p-6 pb-10 shadow-xl rounded-t-2xl">
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-600 hover:text-gray-900 text-2xl leading-none"
          aria-label="閉じる"
          title="閉じる"
        >
          &times;
        </button>

        <h2 className="font-bold mb-1">選択された料理</h2>
        <p className="mb-3 break-words">{openText}</p>

        <div className="flex items-baseline gap-2 mb-2">
          <h2 className="font-bold">選択中のチェックリスト：</h2>
          <span
            className="inline-block px-2 py-0.5 rounded text-base"
            style={{ backgroundColor: chipBg[phase], color: "#1f2937" }}
          >
            {PHASE_LABELS[phase]}
          </span>
        </div>

        <h2 className="font-bold">説明（{PHASE_LABELS[phase]}）</h2>
        <PhaseDescriptionBox description={description} phase={phase} />
        {!description && <p className="text-zinc-500">説明は見つかりませんでした</p>}
      </div>
    </div>
  );
}
