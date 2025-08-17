// app/page3/page.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import Button from "@/components/Button";
import { ChecklistButton, ChecklistPanel, useChecklist } from "@/components/checklist";
import OcrImage from "@/components/OcrImage";
import BottomDrawer from "@/components/BottomDrawer";
import { useMenuMap } from "@/hooks/useMenuMap";
import { useOCR } from "@/hooks/useOCR";
import { canon } from "@/lib/textNormalize";
import type { PhaseKey } from "@/types/food";

export default function Page3() {
  const { phase } = useChecklist();
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState("");

  // CSV → 正規化マップ
  const menuMap = useMenuMap("/yochiyochi.csv");

  // 画像 → OCR（枠とスケール）
  const { boxes, loading, scale, onImgLoad } = useOCR(imgSrc);

  // 画像は localStorage から取得
  useEffect(() => {
    setImgSrc(localStorage.getItem("uploadedImage"));
  }, []);

  // 現在段階の説明を返す（完全一致のみ）
  const getPhaseDescriptionForText = (text?: string) => {
    const key = canon(text);
    const info = key ? menuMap[key] : undefined;
    return info?.[phase]?.trim() || "";
  };

  // 表示するボックス（説明があるものだけ）
  const visibleFilter = (b: { description: string }) =>
    !!getPhaseDescriptionForText(b.description);

  const selectedDescription = useMemo(
    () => (selectedText ? getPhaseDescriptionForText(selectedText) : ""),
    [selectedText, menuMap, phase]
  );

  return (
    <main className="min-h-screen bg-purple-50 flex flex-col items-center justify-center gap-8 p-6 relative">
      <ChecklistButton />
      <ChecklistPanel />

      {imgSrc ? (
        <TransformWrapper doubleClick={{ disabled: true }}>
          <TransformComponent wrapperClass="w-full h-full">
            <OcrImage
              imgSrc={imgSrc}
              boxes={boxes}
              scale={scale}
              phase={phase as PhaseKey}
              onImgLoad={onImgLoad}
              filter={visibleFilter}
              onPick={setSelectedText}
            />
          </TransformComponent>
        </TransformWrapper>
      ) : (
        <p className="text-zinc-700">画像がありません。/page2 で画像を選択してください。</p>
      )}

      <div className="flex gap-3">
        <Button href="/page2" variant="green">写真を変える</Button>
        <Button href="/" variant="gray">ホームに戻る</Button>
      </div>

      {loading && (
        <p className="absolute top-3 right-3 z-20 bg-white/90 px-3 py-1 rounded">OCR処理中...</p>
      )}

      <BottomDrawer
        openText={selectedText}
        description={selectedDescription}
        phase={phase as PhaseKey}
        onClose={() => setSelectedText("")}
      />
    </main>
  );
}
