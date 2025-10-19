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
  onShowAccidentInfo?: () => void;
  accidentInfo?: string;
  showAccidentInfo?: boolean;
};

export default function BottomDrawer({
  openText,
  description,
  phase,
  variant,
  onClose,
  onShowAccidentInfo,
  accidentInfo,
  showAccidentInfo,
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

        {/* 事故情報ボタン */}
        {onShowAccidentInfo && !showAccidentInfo && (
          <div className="mt-2 pt-2 border-t border-[#E8DCD0] flex justify-end">
            <button
              type="button"
              onClick={onShowAccidentInfo}
              className="text-[#6b5a4e] underline underline-offset-4 
                         font-semibold transition-opacity duration-200 hover:opacity-70 py-1"
            >
              事故情報を見る
            </button>
          </div>
        )}

        {/* 事故情報表示エリア */}
        {showAccidentInfo && accidentInfo && (
          <div className="mt-4 pt-4 border-t border-[#E8DCD0]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-[#5C3A2E]">
                事故情報
              </h3>
              <button
                type="button"
                onClick={() => onShowAccidentInfo && onShowAccidentInfo()}
                className="text-[#6b5a4e] text-decoration-underline text-underline-offset-4 
                           font-semibold transition-opacity duration-200 hover:opacity-70"
              >
                閉じる
              </button>
            </div>
            <div className="bg-[#F8E8E8] rounded-lg p-4 border border-[#E8DCD0]">
              <div className="text-[#4D3F36] leading-relaxed whitespace-pre-wrap">
                {accidentInfo}
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
