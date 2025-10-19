"use client";

import { useState, useMemo, useEffect, ChangeEvent } from "react";
import Image from "next/image";
import { Camera, Image as ImageIcon, Loader2, Search } from "lucide-react";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ChecklistButton, ChecklistPanel, useChecklist } from "@/components/checklist";
import OcrImage from "@/components/OcrImage";
import BottomDrawer from "@/components/BottomDrawer";
import { useOCR } from "@/hooks/useOCR";
import { canon } from "@/lib/textNormalize";
import type { PhaseKey } from "@/types/food";
import imageCompression from "browser-image-compression";
import Ribbon from "@/components/Ribbon";
import LoadingSpinner from "@/components/LoadingSpinner";
import * as gtag from "@/lib/gtag"; // ★ GA イベント用を追加
import { supabase } from "@/lib/supabaseClient"; // ★ Supabaseを追加

type Box = { description: string };
type Variant = "forbidden" | "ok" | "none";

// ====== 色とボタン ======
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
  const [menuMap, setMenuMap] = useState<Record<string, any>>({}); // ★ Supabaseデータを保持
  const [foodIdMap, setFoodIdMap] = useState<Record<string, number>>({}); // ★ food_name -> food_id マップ
  const [accidentInfo, setAccidentInfo] = useState<string>("");
  const [showAccidentInfo, setShowAccidentInfo] = useState(false);

  const { boxes, loading, scale, onImgLoad } = useOCR(imgSrc);

  // ===== Supabaseからデータを取得 =====
  useEffect(() => {
    async function fetchMenuData() {
      try {
        // yochiyochi_foodlistからデータを取得
        const { data: foodData, error: foodError } = await supabase
          .from("yochiyochi_foodlist")
          .select("food_id, food_name, cook_id");
        
        if (foodError) {
          // フォールバック: 元のテーブルを使用
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("NagasakiDemoData")
            .select("*");
          
          if (fallbackError || !fallbackData) return;
          
          const map: Record<string, any> = {};
          for (const row of fallbackData) {
            const key = canon(row.food_name);
            if (key) {
              map[key] = {
                phase1: row.description_phase1?.trim(),
                phase2: row.description_phase2?.trim(),
                phase3: row.description_phase3?.trim(),
                phase4: row.description_phase4?.trim(),
                phase5: row.description_phase5?.trim(),
              };
            }
          }
          setMenuMap(map);
          return;
        }

        if (!foodData || foodData.length === 0) return;

        // yochiyochi_cooklistからデータを取得
        const { data: cookData, error: cookError } = await supabase
          .from("yochiyochi_cooklist")
          .select("cook_id, description_phase1, description_phase2, description_phase3, description_phase4, description_phase5");
        
        if (cookError || !cookData || cookData.length === 0) return;

        // cook_idをキーとしたマップを作成
        const cookMap = new Map();
        for (const cook of cookData) {
          cookMap.set(cook.cook_id, cook);
        }

        // foodlistとcooklistを結合してマップを作成
        const map: Record<string, any> = {};
        const foodIdMap: Record<string, number> = {};
        
        for (const food of foodData) {
          const key = canon(food.food_name);
          if (!key) continue;
          
          // food_idマップを作成
          foodIdMap[key] = food.food_id;
          
          // cook_idで調理法データを取得
          const cookInfo = cookMap.get(food.cook_id);
          if (cookInfo) {
            map[key] = {
              phase1: cookInfo.description_phase1?.trim(),
              phase2: cookInfo.description_phase2?.trim(),
              phase3: cookInfo.description_phase3?.trim(),
              phase4: cookInfo.description_phase4?.trim(),
              phase5: cookInfo.description_phase5?.trim(),
            };
          }
        }

        setMenuMap(map);
        setFoodIdMap(foodIdMap);
      } catch (error) {
        console.error("データ取得エラー:", error);
      }
    }

    fetchMenuData();
  }, []);

  // ===== 画像選択（ファイル or カメラ） =====
  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>, source: "camera" | "file") => {
    const picked = e.target.files?.[0];
    if (!picked) return;

    // ★ GAイベント送信
    gtag.event({
      action: source === "camera" ? "camera_upload_selected" : "file_upload_selected",
      category: "engagement",
      label: picked.name,
    });

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
    if (val === "食べさせてはいけません。") return { variant: "forbidden", text: "食べさせてはいけません" };
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
    setAccidentInfo("");
    setShowAccidentInfo(false);
  };

  // Drawer 開いているか（= テキスト選択あり）
  const drawerOpen = Boolean(selectedText);

  // ★ OCRテキスト選択時にGA送信
  const handlePick = (text: string) => {
    setSelectedText(text);
    if (text) {
      gtag.event({
        action: "ocr_text_selected",
        category: "engagement",
        label: text,
      });
    }
  };

  // BottomDrawerを閉じる際に事故情報もリセット
  const handleCloseDrawer = () => {
    setSelectedText("");
    setAccidentInfo("");
    setShowAccidentInfo(false);
  };

  // 事故情報を取得して表示
  const handleShowAccidentInfo = async () => {
    if (!selectedText) return;

    // 既に表示されている場合は閉じる
    if (showAccidentInfo) {
      setShowAccidentInfo(false);
      return;
    }

    const key = canon(selectedText);
    const foodId = key ? foodIdMap[key] : null;

    if (!foodId) {
      setAccidentInfo("該当する食材の事故情報が見つかりません。");
      setShowAccidentInfo(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("yochiyochi_accidentlist")
        .select("description_accident")
        .eq("food_id", foodId)
        .single();

      if (error || !data) {
        setAccidentInfo("事故情報が見つかりません。");
      } else {
        setAccidentInfo(data.description_accident || "事故情報がありません。");
      }
    } catch (error) {
      console.error("事故情報取得エラー:", error);
      setAccidentInfo("事故情報の取得に失敗しました。");
    }

    setShowAccidentInfo(true);
  };

  // =============== Upload View ===============
  const UploadView = (
    <div className="flex flex-col flex-grow items-center justify-center">
      {!preview && (
        <div className="flex flex-col gap-8 items-center justify-center flex-grow mt-8">
          {/* カメラとアルバムを横並び */}
          <div className="flex gap-8 items-center justify-center">
            {/* カメラ */}
            <div className="flex flex-col items-center gap-3">
              <p className="text-[#6B5A4E] text-lg font-bold">カメラで撮る</p>
              <label
                htmlFor="camera-upload"
                className="w-32 h-32 bg-[#E8DCD0] border border-[#D3C5B9] flex items-center justify-center rounded-xl cursor-pointer"
              >
                <Camera className="w-10 h-10" />
                <input
                  id="camera-upload"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={(e) => handleImageChange(e, "camera")} // ★ カメラ選択
                  className="hidden"
                />
              </label>
            </div>

            {/* ファイル */}
            <div className="flex flex-col items-center gap-3">
              <p className="text-[#6B5A4E] text-lg font-bold">アルバムから選ぶ</p>
              <label
                htmlFor="file-upload"
                className="w-32 h-32 bg-[#E8DCD0] border border-[#D3C5B9] flex items-center justify-center rounded-xl cursor-pointer"
              >
                <ImageIcon className="w-10 h-10" />
                <input
                  id="file-upload"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, "file")} // ★ ファイル選択
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* 検索ボタン */}
          <div className="flex flex-col items-center gap-3">
            <p className="text-[#6B5A4E] text-lg font-bold">検索する</p>
            <a
              href="/page6"
              className="w-32 h-32 bg-[#E8DCD0] border border-[#D3C5B9] flex items-center justify-center rounded-xl cursor-pointer hover:bg-[#D3C5B9] transition"
            >
              <Search className="w-10 h-10" />
            </a>
          </div>
        </div>
      )}

      {/* アップロード前プレビュー */}
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

  // =============== OCR View ===============
  const OcrView = (
    <div className="relative flex flex-col flex-grow h-[calc(100svh-var(--ribbon-h))] px-3">
      <div className="flex-none py-2">
        <ChecklistButton />
        <ChecklistPanel />
      </div>

      <div
        className={`relative flex-grow transition-transform duration-500 will-change-transform ${
          drawerOpen ? "-translate-y-[var(--ribbon-shift)]" : "translate-y-0"
        }`}
        aria-busy={loading}
      >
        <div className="absolute inset-0">
          <TransformWrapper doubleClick={{ disabled: true }} disabled={loading}>
            <TransformComponent wrapperClass="w-full h-full">
              <div className="w-full h-full">
                <OcrImage
                  imgSrc={imgSrc!}
                  boxes={boxes}
                  scale={scale}
                  phase={phase as PhaseKey}
                  onImgLoad={onImgLoad}
                  filter={visibleFilter}
                  onPick={handlePick} // ★ OCRテキスト選択イベント
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
    </div>
  );

  const RIBBON_HEIGHT = "6rem" as const;
  const RIBBON_SHIFT = "7rem" as const;

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

      <div className="flex-grow pt-24">{imgSrc ? OcrView : UploadView}</div>

      <BottomDrawer
        openText={selectedText}
        description={selected.text}
        phase={phase as PhaseKey}
        variant={selected.variant}
        onClose={handleCloseDrawer}
        onShowAccidentInfo={handleShowAccidentInfo}
        accidentInfo={accidentInfo}
        showAccidentInfo={showAccidentInfo}
      />

      {loading && <LoadingSpinner />}
    </main>
  );
}
