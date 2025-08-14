// app/page3/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

import {
  ChecklistButton,
  ChecklistPanel,
  useChecklist,
  PHASE_LABELS,
  type PhaseKey,
} from "@/components/checklist";
import Button from "@/components/Button";
import PhaseDescriptionBox from "@/components/PhaseDescriptionBox";

/* ---------- 型 ---------- */
type Vertex = { x: number; y: number };
type BoundingBox = { description: string; boundingPoly: { vertices: Vertex[] } };
type ParsedRow = {
  food_name: string;
  description_phase1?: string;
  description_phase2?: string;
  description_phase3?: string;
  description_phase4?: string;
};
type FoodMap = Record<
  string,
  { phase1?: string; phase2?: string; phase3?: string; phase4?: string }
>;

/* ---------- 正規化ユーティリティ（表記ゆれ吸収用） ---------- */
// カタカナ → ひらがな
const toHiragana = (s: string) =>
  s.replace(/[ァ-ン]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0x60));

// かっこ内表記を除去（()（）[]{}「」『』〈〉《》など）
const stripBrackets = (s: string) =>
  s
    // 丸かっこ
    .replace(/[\(\（][^\)\）]*[\)\）]/g, "")
    // 角/波/山/二重かっこ等
    .replace(/[「『\[\{〈《【][^』」\]\}〉》】]*[』」\]\}〉》】]/g, "");

// 完全一致用の“正規化キー”を作る
const canon = (s?: string) => {
  let x = (s ?? "")
    .normalize("NFKC") // 全角/半角等を統一
    .toLowerCase();
  x = x.replace(/\s+/g, ""); // 空白削除
  x = toHiragana(x); // カタカナ→ひらがな
  x = stripBrackets(x); // かっこ内注記を削除
  x = x.replace(/ー/g, ""); // 長音削除
  x = x.replace(/[・･\.\,，、\/／\-\–—_]/g, ""); // 記号類を削除
  return x;
};

/* ---------- 段階ごとの枠線カラー ---------- */
const borderColorByPhase: Record<PhaseKey, string> = {
  phase1: "#3b82f6", // blue-500
  phase2: "#22c55e", // green-500
  phase3: "#f59e0b", // amber-500
  phase4: "#ec4899", // pink-500
};

export default function Page3() {
  const { phase } = useChecklist(); // 現在の離乳段階
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [boxes, setBoxes] = useState<BoundingBox[]>([]);
  const [selectedText, setSelectedText] = useState<string>(""); // これがあるとボトムアップが出る
  const [loading, setLoading] = useState<boolean>(false);
  const [menuMap, setMenuMap] = useState<FoodMap>({});
  const [scale, setScale] = useState<{ x: number; y: number }>({ x: 1, y: 1 });

  /* ---------- CSV 読み込み（正規化キーで保存 & 同キーの行はマージ） ---------- */
  useEffect(() => {
    let cancelled = false;
    fetch("/yochiyochi.csv")
      .then((r) => r.text())
      .then((csv) =>
        Papa.parse(csv, {
          header: true,
          complete: (res) => {
            if (cancelled) return;
            const map: FoodMap = {};
            (res.data as ParsedRow[]).forEach((row) => {
              const key = canon(row.food_name);
              if (!key) return;

              const next = {
                phase1: row.description_phase1?.trim(),
                phase2: row.description_phase2?.trim(),
                phase3: row.description_phase3?.trim(),
                phase4: row.description_phase4?.trim(),
              };

              // 既に同キーがある場合は「空欄だけ埋める」形でマージ
              if (map[key]) {
                map[key] = {
                  phase1: map[key].phase1 || next.phase1,
                  phase2: map[key].phase2 || next.phase2,
                  phase3: map[key].phase3 || next.phase3,
                  phase4: map[key].phase4 || next.phase4,
                };
              } else {
                map[key] = next;
              }
            });
            setMenuMap(map);
          },
        })
      )
      .catch(() => setMenuMap({}));
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- 画像を localStorage から取得 ---------- */
  useEffect(() => {
    const stored = localStorage.getItem("uploadedImage");
    setImgSrc(stored);
  }, []);

  /* ---------- OCR 実行 ---------- */
  useEffect(() => {
    const runOCR = async () => {
      if (!imgSrc) return;
      setLoading(true);
      try {
        const base64NoPrefix = imgSrc.includes(",") ? imgSrc.split(",")[1] : imgSrc;
        const res = await fetch("/api/vision-ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64NoPrefix }),
        });
        const json = await res.json();

        const anns = (json?.responses?.[0]?.textAnnotations ?? []) as any[];
        const nextBoxes: BoundingBox[] = anns.slice(1).map((a) => ({
          description: a.description,
          boundingPoly: {
            vertices: a.boundingPoly.vertices.map((v: Partial<Vertex>) => ({
              x: v.x ?? 0,
              y: v.y ?? 0,
            })),
          },
        }));
        setBoxes(nextBoxes);
      } catch (e) {
        console.error("OCR error:", e);
        setBoxes([]);
      } finally {
        setLoading(false);
      }
    };
    runOCR();
  }, [imgSrc]);

  /* ---------- 画像読込時にスケール取得 ---------- */
  const onImgLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const el = e.currentTarget;
    setScale({
      x: el.clientWidth / (el.naturalWidth || 1),
      y: el.clientHeight / (el.naturalHeight || 1),
    });
  };

  /* ---------- 指定テキストの、現在段階の説明を取得（正規化キーで完全一致のみ） ---------- */
  const getPhaseDescriptionForText = (text?: string): string => {
    const key = canon(text);
    if (!key) return "";
    const info = menuMap[key]; // ← 完全一致のみ
    return info?.[phase]?.trim() || "";
  };

  /* ---------- ボックススタイル（段階色を反映） ---------- */
  const styleFromBox = (b: BoundingBox): React.CSSProperties => {
    const v = b.boundingPoly.vertices;
    const v0 = v[0] ?? { x: 0, y: 0 };
    const v1 = v[1] ?? v0;
    const v2 = v[2] ?? v1;
    return {
      position: "absolute",
      left: v0.x * scale.x,
      top: v0.y * scale.y,
      width: Math.max(1, (v1.x - v0.x) * scale.x),
      height: Math.max(1, (v2.y - v1.y) * scale.y),
      border: `2px solid ${borderColorByPhase[phase]}`,
      boxSizing: "border-box",
      cursor: "pointer",
      // 背景の薄い色をつけたい場合は有効化
      // backgroundColor: `${borderColorByPhase[phase]}22`,
    };
  };

  /* ---------- 選択された料理の説明（メモ化） ---------- */
  const selectedDescription = useMemo(() => {
    if (!selectedText) return "";
    return getPhaseDescriptionForText(selectedText);
  }, [selectedText, menuMap, phase]);

  /* ---------- 現在段階で説明があるボックスのみ表示 ---------- */
  const visibleBoxes = useMemo(
    () => boxes.filter((b) => !!getPhaseDescriptionForText(b.description)),
    [boxes, menuMap, phase]
  );

  return (
    <main className="min-h-screen bg-purple-50 flex flex-col items-center justify-center gap-8 p-6 relative">
      {/* 右上のチェックリスト・右ドロワー */}
      <ChecklistButton />
      <ChecklistPanel />

      {/* 画像ビュー */}
      {imgSrc ? (
        <section className="w-full max-w-3xl aspect-[3/4] bg-black/80 rounded-lg overflow-hidden relative shadow">
          {loading && (
            <p className="absolute top-3 right-3 z-20 bg-white/90 px-3 py-1 rounded">OCR処理中...</p>
          )}
          <TransformWrapper doubleClick={{ disabled: true }}>
            <TransformComponent wrapperClass="w-full h-full">
              <div className="relative inline-block w-full h-full">
                <img
                  src={imgSrc}
                  onLoad={onImgLoad}
                  alt="uploaded"
                  className="block w-full h-full object-contain select-none"
                  draggable={false}
                />
                {/* 説明がある単語のみ、段階色でボックス表示 */}
                {visibleBoxes.map((b, i) => (
                  <div
                    key={`${b.description}-${i}`}
                    style={styleFromBox(b)}
                    onClick={() => setSelectedText(b.description)} // ← クリックで“にょきっ”
                    title={b.description}
                  />
                ))}
              </div>
            </TransformComponent>
          </TransformWrapper>
        </section>
      ) : (
        <p className="text-zinc-700">画像がありません。/page2 で画像を選択してください。</p>
      )}

      {/* ページ内ナビ */}
      <div className="flex gap-3">
        <Button href="/page2" variant="green">写真を変える</Button>
        <Button href="/" variant="gray">ホームに戻る</Button>
      </div>

      {/* ===== ボトムアップ（にょきっと表示/非表示） ===== */}
      <div
        role="dialog"
        aria-hidden={selectedText ? "false" : "true"}
        aria-label="料理の説明"
        className={`fixed inset-x-0 bottom-0 z-30 transform transition-transform duration-300 ${
          selectedText ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="relative bg-white p-6 pb-10 shadow-xl rounded-t-2xl">
          {/* 右上の × ボタン */}
          <button
            onClick={() => setSelectedText("")}
            className="absolute top-2 right-3 text-gray-600 hover:text-gray-900 text-2xl leading-none"
            aria-label="閉じる"
            title="閉じる"
          >
            &times;
          </button>

          <h2 className="font-bold mb-1">選択された料理</h2>
          <p className="mb-3 break-words">{selectedText}</p>

          <div className="flex items-baseline gap-2 mb-2">
            <h2 className="font-bold">選択中のチェックリスト：</h2>
            <span
              className="inline-block px-2 py-0.5 rounded text-base"
              style={{
                backgroundColor: `${borderColorByPhase[phase]}22`,
                color: "#1f2937", // gray-800
              }}
            >
              {PHASE_LABELS[phase]}
            </span>
          </div>

          <h2 className="font-bold">説明（{PHASE_LABELS[phase]}）</h2>

          {/* 説明がある時だけ色付きテキストボックスを表示 */}
          <PhaseDescriptionBox description={selectedDescription} phase={phase} />

          {/* 説明がない時のフォールバック表示 */}
          {!selectedDescription && (
            <p className="text-zinc-500">説明は見つかりませんでした</p>
          )}
        </div>
      </div>
    </main>
  );
}
