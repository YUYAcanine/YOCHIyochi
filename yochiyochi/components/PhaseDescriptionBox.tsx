// components/PhaseDescriptionBox.tsx
import React from "react";
import type { PhaseKey } from "@/types/food";

type Variant = "forbidden" | "ok" | "none" | "child";

type Props = { description?: string; phase: PhaseKey; variant?: Variant };

// 繝・ヵ繧ｩ繝ｫ繝医・鮟・∫ｦ∵ｭ｢縺ｮ縺ｿ襍､
const classesByVariant: Record<Variant, string> = {
  forbidden: "bg-red-100 border-red-400 text-red-800",
  ok: "bg-yellow-100 border-yellow-400 text-zinc-800",
  none: "bg-gray-100 border-gray-400 text-zinc-800",
  child: "bg-green-100 border-green-400 text-green-800",
};

export default function PhaseDescriptionBox({ description, phase, variant = "ok" }: Props) {
  if (!description) return null;
  const colorClass = classesByVariant[variant] ?? classesByVariant.ok;
  const label = variant === "child" ? "Child note" : `Phase: ${phase}`;
  return (
    <div className={`w-full p-2 border rounded mt-2 ${colorClass}`}>
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      <textarea
        value={description}
        readOnly
        className="w-full bg-transparent outline-none resize-y"
      />
    </div>
  );
}



