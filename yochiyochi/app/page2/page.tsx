// app/page2/page.tsx
"use client";

import { useState, useMemo, ChangeEvent } from "react";
import Image from "next/image";
import { Camera, Image as ImageIcon } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ChecklistButton, ChecklistPanel, useChecklist } from "@/components/checklist";
import OcrImage from "@/components/OcrImage";
import BottomDrawer from "@/components/BottomDrawer";
import { useMenuMap } from "@/hooks/useMenuMap";
import { useOCR } from "@/hooks/useOCR";
import { canon } from "@/lib/textNormalize";
import type { PhaseKey } from "@/types/food";
import imageCompression from "browser-image-compression";
import Ribbon from "@/components/Ribbon";

type Box = { description: string };
type Variant = "forbidden" | "ok" | "none";

// ====== 色とボタン（必要なら使ってください） ======
const BTN_BASE =
  "inline-flex items-center justify-center rounded-xl px-6 py-3 font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2";

const BTN_SECONDARY = `${BTN_BASE} bg-[#CBB9AB] hover:bg-[#B8A598] text-[#3A2C25] border border-[#BCAAA0] focus:ring-[#A88877] focus:ring-offset-[#FAF8F6]`;
const BTN_WIDE_SECONDARY = `${BTN_SECONDARY} w-full max-w-[480px] py-4`;

export default function Page2() {
  const { phase } = useChecklist();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);

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
        maxWidthOrHeight: 1280,
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
    setPreview(dataUrl);
    setImgSrc(dataUrl); // OCR表示へ切替
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

  // Drawer 開いているか（= テキスト選択あり）
  const drawerOpen = Boolean(selectedText);

  // =============== Upload View（アップロード前） ===============
  const UploadView = (
    <div className="flex flex-col flex-grow items-center justify-center">
      {!preview && (
        <div className="flex flex-col gap-12 items-center justify-center flex-grow mt-8">
          {/* カメラ */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-[#6B5A4E] text-lg font-bold">カメラで撮る</p>
            <label
              htmlFor="camera-upload"
              className="w-36 h-36 bg-[#E8DCD0] border border-[#D3C5B9] flex items-center justify-center rounded-xl cursor-pointer"
            >
              <Camera className="w-12 h-12" />
              <input
                id="camera-upload"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>

          {/* ファイル */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-[#6B5A4E] text-lg font-bold">アルバムから選ぶ</p>
            <label
              htmlFor="file-upload"
              className="w-36 h-36 bg-[#E8DCD0] border border-[#D3C5B9] flex items-center justify-center rounded-xl cursor-pointer"
            >
              <ImageIcon className="w-12 h-12" />
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {/* アップロード前プレビュー（任意） */}
      {preview && !imgSrc && (
        <div className="px-4 flex justify-center">
          <Image
            src={preview}
            alt="preview"
            width={900}
            height={900}
            className="rounded-xl border border-[#D3C5B9] max-w-[92vw] max-h-[78vh] w-auto h-auto"
          />
        </div>
      )}
    </div>
  );

  // =============== OCR View（アップロード後） ===============
  // 画面高 - リボン高 をほぼフルに使う（リボン高はCSS変数で同期）
  const OcrView = (
    <div className="relative flex flex-col flex-grow h-[calc(100svh-var(--ribbon-h))] px-3">
      <div className="flex-none py-2">
        <ChecklistButton />
        <ChecklistPanel />
      </div>

      {/* プレビュー（OCR表示）領域：★BottomDrawer表示中はシフト量だけ上にスライド */}
      <div
        className={`relative flex-grow transition-transform duration-500 will-change-transform ${
          drawerOpen ? "-translate-y-[var(--ribbon-shift)]" : "translate-y-0"
        }`}
      >
        <div className="absolute inset-0">
          <TransformWrapper doubleClick={{ disabled: true }}>
            <TransformComponent wrapperClass="w-full h-full">
              <div className="w-full h-full">
                <OcrImage
                  imgSrc={imgSrc!}
                  boxes={boxes}
                  scale={scale}
                  phase={phase as PhaseKey}
                  onImgLoad={onImgLoad}
                  filter={visibleFilter}
                  onPick={setSelectedText}
                  getBoxVariant={getBoxVariant}
                />
              </div>
            </TransformComponent>
          </TransformWrapper>
        </div>

        {/* ▼ プレビュー直下に小さめのボタン配置 */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-4 z-40 flex justify-center pointer-events-none">
          <a
            href="/page2"
            onClick={(e) => {
              e.preventDefault();
              resetImage();
            }}
            className="inline-flex items-center justify-center rounded-lg 
                       px-6 py-2 text-sm font-medium 
                       bg-[#CBB9AB] hover:bg-[#B8A598] text-[#3A2C25] 
                       border border-[#BCAAA0] 
                       shadow-md backdrop-blur-sm bg-white/85 
                       pointer-events-auto"
          >
            別の画像にする
          </a>
        </div>
      </div>

      {loading && (
        <p className="absolute top-2 right-3 z-50 bg-white/90 px-3 py-1 rounded-md text-[#6B5A4E]">
          OCR処理中...
        </p>
      )}
    </div>
  );

  // ====== リボンの寸法をCSS変数で一元管理 ======
  // 見た目の高さ（RibbonのheightClassと一致）
  const RIBBON_HEIGHT = "6rem" as const;    // h-24
  // 完全に隠すためのシフト量（影・余白込みで多めに）
  const RIBBON_SHIFT = "10rem" as const;

  return (
    <main
      className="min-h-screen bg-[#FAF8F6] text-[#4D3F36] relative flex flex-col"
      style={
        {
          ["--ribbon-h" as any]: RIBBON_HEIGHT,
          ["--ribbon-shift" as any]: RIBBON_SHIFT,
        } as React.CSSProperties
      }
    >
      {/* 固定リボン（常に表示）。BottomDrawer表示中はリボンを上に隠す */}
      <Ribbon
        href="/"
        logoSrc="/yoyochi.jpg"
        alt="よちヨチ ロゴ"
        heightClass="h-24"              // = 6rem
        bgClass="bg-[#F0E4D8]"
        containerClassName={`transition-transform duration-500 will-change-transform ${
          drawerOpen ? "-translate-y-[var(--ribbon-shift)]" : "translate-y-0"
        }`}
        logoClassName="h-20 w-auto object-contain"
      />

      {/* コンテンツはリボン見かけの高さ分だけ下げる */}
      <div className="flex-grow pt-24">
        {imgSrc ? OcrView : UploadView}
      </div>

      {/* ★ transform の外に置く：パネルは元の最下部固定のまま */}
      <BottomDrawer
        openText={selectedText}
        description={selected.text}
        phase={phase as PhaseKey}
        variant={selected.variant}
        onClose={() => setSelectedText("")}
      />
    </main>
  );
}




