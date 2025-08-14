// components/PhaseDescriptionBox.tsx
import React from "react";

type Props = {
  description?: string;
  phase: string; // phase1, phase2, phase3, phase4
};

const phaseColors: Record<string, string> = {
  phase1: "bg-blue-100 border-blue-400",    // 離乳初期
  phase2: "bg-green-100 border-green-400",  // 離乳中期
  phase3: "bg-yellow-100 border-yellow-400",// 離乳後期
  phase4: "bg-pink-100 border-pink-400",    // 完了期
};

export default function PhaseDescriptionBox({ description, phase }: Props) {
  if (!description) return null; // 説明がない場合は表示しない

  const colorClass = phaseColors[phase] || "bg-gray-100 border-gray-400";

  return (
    <textarea
      value={description}
      readOnly
      className={`w-full p-2 border rounded mt-2 ${colorClass}`}
    />
  );
}
