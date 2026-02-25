"use client";

import React from "react";
import { ChevronDown } from "lucide-react";
import type { PhaseKey } from "@/types/food";

type Props = {
  phase: PhaseKey;
  onChangePhase: (phase: PhaseKey) => void;
  labels: Record<PhaseKey, string>;
  className?: string;
};

export default function PhaseSelectDropdown({
  phase,
  onChangePhase,
  labels,
  className = "",
}: Props) {
  return (
    <div className={className}>
      <div className="relative rounded-xl bg-[#B89072] p-2 shadow-md">
        <select
          value={phase}
          onChange={(e) => onChangePhase(e.target.value as PhaseKey)}
          className="h-10 min-w-[210px] appearance-none rounded-md bg-[#F2F0EE] px-4 pr-16 text-lg font-bold text-[#2F2A27] outline-none"
          aria-label="離乳期の選択"
        >
          {(Object.keys(labels) as PhaseKey[]).map((key) => (
            <option key={key} value={key}>
              {labels[key]}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-2 top-2 h-10 w-12 rounded-r-md bg-[#B89072]" />
        <ChevronDown
          strokeWidth={3.5}
          className="pointer-events-none absolute right-5 top-1/2 h-6 w-6 -translate-y-1/2 text-white"
        />
      </div>
    </div>
  );
}
