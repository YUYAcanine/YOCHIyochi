// components/OcrImage.tsx
"use client";

import React from "react";
import type { PhaseKey } from "@/types/food";
import type { BoundingBox } from "@/hooks/useOCR";

const borderColorByPhase: Record<PhaseKey, string> = {
  phase1: "#3b82f6",
  phase2: "#22c55e",
  phase3: "#f59e0b",
  phase4: "#ec4899",
};

type Props = {
  imgSrc: string;
  boxes: BoundingBox[];
  /** 等倍スケール + 余白 */
  scale: { scale: number; offsetX: number; offsetY: number };
  phase: PhaseKey;
  onImgLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  /** 表示するかどうかのフィルタ（説明があるものだけ等） */
  filter: (b: BoundingBox) => boolean;
  /** クリックされたときのテキスト通知 */
  onPick: (text: string) => void;
};

export default function OcrImage({
  imgSrc,
  boxes,
  scale,
  phase,
  onImgLoad,
  filter,
  onPick,
}: Props) {
  const styleFromBox = (b: BoundingBox): React.CSSProperties => {
    const v = b.boundingPoly.vertices;

    // 頂点順が怪しくても安定するよう min/max から矩形化
    const xs = v.map((p) => p?.x ?? 0);
    const ys = v.map((p) => p?.y ?? 0);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const s = scale.scale;
    const left = scale.offsetX + minX * s;
    const top = scale.offsetY + minY * s;
    const width = Math.max(1, (maxX - minX) * s);
    const height = Math.max(1, (maxY - minY) * s);

    return {
      position: "absolute",
      left,
      top,
      width,
      height,
      border: `2px solid ${borderColorByPhase[phase]}`,
      boxSizing: "border-box",
      cursor: "pointer",
    };
  };

  return (
    <section className="w-full max-w-3xl aspect-[3/4] bg-black/80 rounded-lg overflow-hidden relative shadow">
      <div className="relative inline-block w-full h-full">
        <img
          src={imgSrc}
          onLoad={onImgLoad}
          alt="uploaded"
          className="block w-full h-full object-contain select-none"
          draggable={false}
        />
        {boxes.filter(filter).map((b, i) => (
          <div
            key={`${b.description}-${i}`}
            style={styleFromBox(b)}
            onClick={() => onPick(b.description)}
            title={b.description}
          />
        ))}
      </div>
    </section>
  );
}
