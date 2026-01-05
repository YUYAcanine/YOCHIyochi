"use client";

/**
 * このページの役割
 * - 画像（カメラ/アルバム）を選ぶ
 * - OCR結果のテキスト領域(boxes)を画像上に重ねて表示
 * - タップされたテキストをメニュー辞書に照合し、フェーズ別に判定
 * - 選択中は下部ドロワーに判定結果/事故情報を表示
 */

import React, { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import Ribbon from "@/components/Ribbon";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useChecklist } from "@/components/checklist";

import { Camera, Image as ImageIcon, Search } from "lucide-react";
import type { ChangeEvent, ComponentProps } from "react";

import OcrStage from "@/components/OcrStage";
import OcrBottomDrawer from "@/components/OcrBottomDrawer";
import OcrImage from "@/components/OcrImage";

import { useOCR } from "@/hooks/useOCR";
import { useMenuData } from "@/hooks/useMenuData";
import { useAccidentInfo } from "@/hooks/useAccidentInfo";
import { useImageInput } from "@/hooks/useImageInput";
import { useAnalytics } from "@/hooks/useAnalytics";

import { canon } from "@/lib/textNormalize";
import type { PhaseKey } from "@/types/food";

/* 型：OcrImageの型から参照して揃える */
type OcrImageProps = ComponentProps<typeof OcrImage>;
type Box = OcrImageProps["boxes"][number];
type ScaleInfo = OcrImageProps["scale"];

type Variant = "forbidden" | "ok" | "none";

type MenuInfo = {
  phase1?: string;
  phase2?: string;
  phase3?: string;
  phase4?: string;
  phase5?: string;
};

const DEFAULT_SCALE: ScaleInfo = { scale: 1, offsetX: 0, offsetY: 0 };

/* 見た目用 */
const RIBBON_HEIGHT = "6rem" as const;
const RIBBON_SHIFT = "7rem" as const;

/* phase を menu のキーに変換（保険） */
const toMenuPhaseKey = (phase: PhaseKey): keyof MenuInfo => {
  if (
    phase === "phase1" ||
    phase === "phase2" ||
    phase === "phase3" ||
    phase === "phase4" ||
    phase === "phase5"
  ) {
    return phase;
  }
  return "phase1";
};

export default function Page2() {
  const router = useRouter();

  // 現在のフェーズ
  const { phase } = useChecklist();

  // 画像と選択テキスト
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState<string>("");

  // テキスト選択中ならドロワーを開く
  const drawerOpen = Boolean(selectedText);

  // 辞書データ（食品名→フェーズ別説明、食品名→ID）
  const { menuMap, foodIdMap } = useMenuData() as {
    menuMap: Record<string, MenuInfo>;
    foodIdMap: Record<string, number>;
  };

  // 事故情報
  const { accidentInfo, showAccidentInfo, fetchByFoodId, reset: resetAccident } =
    useAccidentInfo();

  // 画像入力（file→dataURL）
  const { pickImageAsDataUrl } = useImageInput();

  // 計測（任意）
  const { trackImageSelected, trackOcrTextSelected } = useAnalytics();

  // OCR（imgSrcが入ると実行）
  const { boxes, loading, scale, onImgLoad } = useOCR(imgSrc);

  /* 判定：選択文字を辞書に照合して forbidden/ok/none を返す */
  const classify = useCallback(
    (raw?: string): { variant: Variant; text: string } => {
      const key = canon(raw);
      if (!key) return { variant: "none", text: "" };

      const info = menuMap[key];
      const phaseKey = toMenuPhaseKey(phase);
      const val = info?.[phaseKey]?.trim();

      if (!val) return { variant: "none", text: "" };

      if (val === "食べさせてはいけません。") {
        return { variant: "forbidden", text: "食べさせてはいけません" };
      }
      return { variant: "ok", text: val };
    },
    [menuMap, phase]
  );

  // none は表示しない（重要なboxだけ見せる）
  const visibleFilter = useCallback(
    (b: Box) => classify(b.description).variant !== "none",
    [classify]
  );

  // boxの見た目用（色分けなど）
  const getBoxVariant = useCallback(
    (b: Box): Variant => classify(b.description).variant,
    [classify]
  );

  // ドロワーに出す判定結果
  const selected = useMemo(() => {
    if (!selectedText) return { variant: "none" as Variant, text: "" };
    return classify(selectedText);
  }, [selectedText, classify]);

  /* 画像選択 */
  const handlePickFile = useCallback(
    async (file: File, source: "camera" | "file") => {
      trackImageSelected(source, file.name);
      const dataUrl = await pickImageAsDataUrl(file);
      setImgSrc(dataUrl);
      setSelectedText("");
      resetAccident();
    },
    [pickImageAsDataUrl, resetAccident, trackImageSelected]
  );

  /* boxをタップ */
  const handlePickText = useCallback(
    (text: string) => {
      setSelectedText(text);
      if (text) trackOcrTextSelected(text);
    },
    [trackOcrTextSelected]
  );

  /* ドロワー閉じる */
  const handleCloseDrawer = useCallback(() => {
    setSelectedText("");
    resetAccident();
  }, [resetAccident]);

  /* 画像リセット */
  const handleResetImage = useCallback(() => {
    setImgSrc(null);
    setSelectedText("");
    resetAccident();
  }, [resetAccident]);

  /* 事故情報表示（食品IDで取得） */
  const handleShowAccident = useCallback(async () => {
    if (!selectedText) return;
    const key = canon(selectedText);
    const foodId = key ? foodIdMap[key] : null;
    await fetchByFoodId(foodId);
  }, [selectedText, foodIdMap, fetchByFoodId]);

  /* 検索画面へ */
  const handleGoSearch = useCallback(() => {
    router.push("/Search");
  }, [router]);

  /* input[type=file] 共通ハンドラ */
  const handleChange =
    (source: "camera" | "file") =>
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      handlePickFile(file, source);
      e.target.value = ""; // 同じ画像を再選択できるように
    };

  /* 画像未選択時のUI */
  const UploadView = (
    <div className="flex flex-col flex-grow items-center justify-center">
      <div className="flex flex-col gap-8 items-center justify-center flex-grow mt-8">
        <div className="flex gap-8 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <p className="text-[#6B5A4E] text-lg font-bold">カメラで撮る</p>
            <label className="w-32 h-32 bg-[#E8DCD0] border border-[#D3C5B9] flex items-center justify-center rounded-xl cursor-pointer">
              <Camera className="w-10 h-10" />
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleChange("camera")}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex flex-col items-center gap-3">
            <p className="text-[#6B5A4E] text-lg font-bold">アルバムから選ぶ</p>
            <label className="w-32 h-32 bg-[#E8DCD0] border border-[#D3C5B9] flex items-center justify-center rounded-xl cursor-pointer">
              <ImageIcon className="w-10 h-10" />
              <input
                type="file"
                accept="image/*"
                onChange={handleChange("file")}
                className="hidden"
              />
            </label>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="text-[#6B5A4E] text-lg font-bold">検索する</p>
          <button
            type="button"
            onClick={handleGoSearch}
            className="w-32 h-32 bg-[#E8DCD0] border border-[#D3C5B9] flex items-center justify-center rounded-xl hover:bg-[#D3C5B9] transition"
          >
            <Search className="w-10 h-10" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <main
      className="min-h-screen bg-[#FAF8F6] text-[#4D3F36] relative flex flex-col"
      style={
        {
          "--ribbon-h": RIBBON_HEIGHT,
          "--ribbon-shift": RIBBON_SHIFT,
        } as React.CSSProperties
      }
    >
      <Ribbon
        href="/"
        logoSrc="/yoyochi.jpg"
        alt="よちヨチ ロゴ"
        heightClass="h-24"
        bgClass="bg-[#F0E4D8]"
        containerClassName={`transition-transform duration-500 will-change-transform ${
          drawerOpen ? "-translate-y-[var(--ribbon-shift)]" : "translate-y-0"
        }`}
        logoClassName="h-20 w-auto object-contain"
      />

      <div className="flex-grow pt-24">
        {imgSrc ? (
          <OcrStage
            imgSrc={imgSrc}
            boxes={boxes}
            loading={loading}
            scale={scale ?? DEFAULT_SCALE}
            phase={phase as PhaseKey}
            drawerOpen={drawerOpen}
            onImgLoad={onImgLoad}
            filterBox={visibleFilter}
            getVariant={getBoxVariant}
            onPickText={handlePickText}
            onReset={handleResetImage}
          />
        ) : (
          UploadView
        )}
      </div>

      <OcrBottomDrawer
        selectedText={selectedText}
        description={selected.text}
        phase={phase as PhaseKey}
        variant={selected.variant}
        onClose={handleCloseDrawer}
        onShowAccident={handleShowAccident}
        accidentInfo={accidentInfo}
        showAccidentInfo={showAccidentInfo}
      />

      {loading && <LoadingSpinner />}
    </main>
  );
}
