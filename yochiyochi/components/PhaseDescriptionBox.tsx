// components/PhaseDescriptionBox.tsx
import React from "react";
import type { PhaseKey } from "@/types/food";

type Props = { description?: string; phase: PhaseKey };

const phaseColors: Record<PhaseKey, string> = {
  phase1: "bg-blue-100 border-blue-400",
  phase2: "bg-green-100 border-green-400",
  phase3: "bg-yellow-100 border-yellow-400",
  phase4: "bg-pink-100 border-pink-400",
};

export default function PhaseDescriptionBox({ description, phase }: Props) {
  if (!description) return null;
  const colorClass = phaseColors[phase] || "bg-gray-100 border-gray-400";
  return (
    <textarea
      value={description}
      readOnly
      className={`w-full p-2 border rounded mt-2 ${colorClass}`}
    />
  );
}
