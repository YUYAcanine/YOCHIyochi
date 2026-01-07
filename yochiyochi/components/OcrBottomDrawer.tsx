/**
 * OcrBottomDrawer
 *
 * OCRで選択された文字に対する説明を表示する下部ドロワー。
 *
 * - フェーズ別の注意文言の表示
 * - 事故情報表示ボタンの提供
 *
 * このコンポーネント自身は状態を持たず、
 * 表示内容や開閉制御はすべて props 経由で受け取る。
 * 実体は既存の BottomDrawer コンポーネントをラップしている。
**/

"use client";

import React from "react";
import BottomDrawer from "@/components/BottomDrawer";
import type { PhaseKey } from "@/types/food";

type Variant = "forbidden" | "ok" | "none" | "child";

type Props = {
  selectedText: string;
  description: string;
  phase: PhaseKey;
  variant: Variant;

  onClose: () => void;
  onShowAccident: () => void;

  accidentInfo: string;
  showAccidentInfo: boolean;
};

export default function OcrBottomDrawer({
  selectedText,
  description,
  phase,
  variant,
  onClose,
  onShowAccident,
  accidentInfo,
  showAccidentInfo,
}: Props) {
  return (
    <BottomDrawer
      openText={selectedText}
      description={description}
      phase={phase}
      variant={variant}
      onClose={onClose}
      onShowAccidentInfo={onShowAccident}
      accidentInfo={accidentInfo}
      showAccidentInfo={showAccidentInfo}
    />
  );
}
