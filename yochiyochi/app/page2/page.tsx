// app/page2/page.tsx
"use client";

import { useState, useMemo, ChangeEvent } from "react";
import Image from "next/image";
import { Camera, Image as ImageIcon } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import Button from "@/components/Button"; // ← これはリンク専用として使う
import { ChecklistButton, ChecklistPanel, useChecklist } from "@/components/checklist";
import OcrImage from "@/components/OcrImage";
import BottomDrawer from "@/components/BottomDrawer";
import { useMenuMap } from "@/hooks/useMenuMap";
import { useOCR } from "@/hooks/useOCR";
import { canon } from "@/lib/textNormalize";
import type { PhaseKey } from "@/types/food";
import imageCompression from "browser-image-compression";

type Box = { description: string };
type Variant = "forbidden" | "ok" | "none";

// ボタン風クラス（既存Buttonのvariantに近い見た目）
const BTN_BASE =
  "inline-flex items-center justify-center rounded-lg px-6 py-3 font-semibold shadow transition focus:outline-none focus:ring-2 focus:ring-offset-2";
const BTN_GREEN = `${BTN_BASE} bg-green-600 hover:bg-green-500 text-white focus:ring-green-400`;
const BTN_GRAY = `${BTN_BASE} bg-gray-300 hover:bg-gray-200 text-gray-900 focus:ring-gray-400`;

export default function Page2() {
  const { phase } = useChecklist();

  // メニュー式アップロード
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  // OCR系
  const [selectedText, setSelectedText] = useState("");
  const menuMap = useMenuMap("/yochiyochi.csv");
  const { boxes, loading, scale, onImgLoad } = useOCR(imgSrc);

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (!picked) return;

    let compressed = picked;
    try {
      compressed = await imageCompression(picked, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      });
    } catch {
      compressed = picked;
    }
    setFile(compressed);

    const toDataURL = (blob: Blob) =>
      new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

    const dataUrl = await toDataURL(compressed);
    setPreview(dataUrl);   // プレビュー表示用
    setImgSrc(dataUrl);    // OCR入力
  };

  const classify = (raw?: string): { variant: Variant; text: string } => {
    const key = canon(raw);
    const info = key ? menuMap[key] : undefined;
    const val = info?.[phase]?.trim();
    if (!val) return { variant: "none", text: "" };
    if (val === "×") return { variant: "forbidden", text: "食べさせてはいけません" };
    return { variant: "ok", text: val };
  };

  const visibleFilter = (b: Box) => classify(b.description).variant !== "none";

  const selected = useMemo(() => {
    if (!selectedText) return { variant: "none" as Variant, text: "" };
    return classify(selectedText);
  }, [selectedText, menuMap, phase]);

  const getBoxVariant = (b: Box): Variant => classify(b.description).variant;

  const resetImage = () => {
    setFile(null);
    setPreview(null);
    setImgSrc(null);
    setSelectedText("");
  };

  // アップロード画面
  const UploadView = (
    <main className="flex flex-col min-h-screen items-center justify-start bg-green-50 pt-10">
      {!preview && (
        <div className="flex space-x-4 mt-6 justify-center">
          <label
            htmlFor="camera-upload"
            className="w-24 h-24 bg-white/70 flex items-center justify-center rounded cursor-pointer shadow"
          >
            <Camera className="w-8 h-8" />
            <input
              id="camera-upload"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>

          <label
            htmlFor="file-upload"
            className="w-24 h-24 bg-white/70 flex items-center justify-center rounded cursor-pointer shadow"
          >
            <ImageIcon className="w-8 h-8" />
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </label>
        </div>
      )}

      {preview && (
        <div className="mt-6 px-4">
          <Image src={preview} alt="preview" width={192} height={192} className="rounded shadow" />
        </div>
      )}

      <div className="mt-auto mb-10">
        {/* ナビゲーションは既存の Button（href 必須） */}
        <Button href="/" variant="gray">ホームに戻る</Button>
      </div>
    </main>
  );

  // OCR画面
  const OcrView = (
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
              getBoxVariant={getBoxVariant}
            />
          </TransformComponent>
        </TransformWrapper>
      ) : (
        <p className="text-zinc-700">画像がありません。画像を選択してください。</p>
      )}

      <div className="flex gap-3">
        {/* ← ここは onClick 必要なのでネイティブ button を使用 */}
        <button type="button" onClick={resetImage} className={BTN_GREEN}>
          写真を変える
        </button>

        {/* ← ここはリンク遷移なので既存 Button */}
        <Button href="/" variant="gray">ホームに戻る</Button>
      </div>

      {loading && (
        <p className="absolute top-3 right-3 z-20 bg-white/90 px-3 py-1 rounded">
          OCR処理中...
        </p>
      )}

      <BottomDrawer
        openText={selectedText}
        description={selected.text}
        phase={phase as PhaseKey}
        variant={selected.variant}
        onClose={() => setSelectedText("")}
      />
    </main>
  );

  return imgSrc ? OcrView : UploadView;
}
