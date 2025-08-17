// components/PhaseDescriptionBox.tsx
import React from "react";
import type { PhaseKey } from "@/types/food";

type Variant = "forbidden" | "ok" | "none";

type Props = { description?: string; phase: PhaseKey; variant?: Variant };

// デフォルトは黄、禁止のみ赤
const classesByVariant: Record<Variant, string> = {
  forbidden: "bg-red-100 border-red-400 text-red-800",
  ok: "bg-yellow-100 border-yellow-400 text-zinc-800",
  none: "bg-gray-100 border-gray-400 text-zinc-800",
};

export default function PhaseDescriptionBox({ description, phase, variant = "ok" }: Props) {
  if (!description) return null;
  const colorClass = classesByVariant[variant] ?? classesByVariant.ok;

  return (
    <div className={`w-full p-2 border rounded mt-2 ${colorClass}`}>
      <div className="text-xs text-zinc-500 mb-1">時期: {phase}</div>
      <textarea
        value={description}
        readOnly
        className="w-full bg-transparent outline-none resize-y"
      />
    </div>
  );
}
