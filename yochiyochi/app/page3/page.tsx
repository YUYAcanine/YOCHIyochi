// app/page3/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

import { ChecklistButton, ChecklistPanel } from "@/components/checklist";
import Button from "@/components/Button";

/* ---------- 型 ---------- */
type Vertex = { x: number; y: number };
type BoundingBox = { description: string; boundingPoly: { vertices: Vertex[] } };
type ParsedRow = { name: string; description: string };

export default function Page3() {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [boxes, setBoxes] = useState<BoundingBox[]>([]);
  const [selectedText, setSelectedText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [menuDescriptions, setMenuDescriptions] = useState<Record<string, string>>({});
  const [scale, setScale] = useState<{ x: number; y: number }>({ x: 1, y: 1 });

  /* ---------- CSV 読み込み（初回のみ） ---------- */
  useEffect(() => {
    let cancelled = false;
    fetch("/menu_descriptions.csv")
      .then((r) => r.text())
      .then((csv) =>
        Papa.parse(csv, {
          header: true,
          complete: (res) => {
            if (cancelled) return;
            const map: Record<string, string> = {};
            (res.data as ParsedRow[]).forEach(({ name, description }) => {
              if (name && description) map[name.trim()] = description.trim();
            });
            setMenuDescriptions(map);
          },
        })
      )
      .catch(() => {
        // CSV が無くてもページは動作させる
        setMenuDescriptions({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------- 画像を localStorage から取得 ---------- */
  useEffect(() => {
    const stored = localStorage.getItem("uploadedImage");
    setImgSrc(stored);
  }, []);

  /* ---------- 画像が手に入ったら OCR 実行 ---------- */
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
        // 0番目は全文、以降が単語／行のボックス
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
    const next = {
      x: el.clientWidth / (el.naturalWidth || 1),
      y: el.clientHeight / (el.naturalHeight || 1),
    };
    setScale(next);
  };

  /* ---------- ボックススタイル ---------- */
  const styleFromBox = (b: BoundingBox): React.CSSProperties => {
    const v = b.boundingPoly.vertices;
    // vertices は [左上, 右上, 右下, 左下] を想定
    const v0 = v[0] ?? { x: 0, y: 0 };
    const v1 = v[1] ?? v0;
    const v2 = v[2] ?? v1;
    return {
      position: "absolute",
      left: v0.x * scale.x,
      top: v0.y * scale.y,
      width: Math.max(1, (v1.x - v0.x) * scale.x),
      height: Math.max(1, (v2.y - v1.y) * scale.y),
      border: "2px solid red",
      boxSizing: "border-box",
      cursor: "pointer",
    };
  };

  const selectedDescription = useMemo(
    () => (selectedText ? menuDescriptions[selectedText] : ""),
    [selectedText, menuDescriptions]
  );

  return (
    <main className="min-h-screen bg-purple-50 flex flex-col items-center justify-center gap-8 p-6 relative">
      {/* === 画像ビュー === */}
      {imgSrc ? (
        <section className="w-full max-w-3xl aspect-[3/4] bg-black/80 rounded-lg overflow-hidden relative shadow">
          {loading && (
            <p className="absolute top-3 right-3 z-20 bg-white/90 px-3 py-1 rounded">
              OCR処理中...
            </p>
          )}

          <TransformWrapper doubleClick={{ disabled: true }}>
            <TransformComponent wrapperClass="w-full h-full">
              <div className="relative inline-block w-full h-full">
                {/* オーバーレイ計算のため通常の <img> を使用 */}
                <img
                  src={imgSrc}
                  onLoad={onImgLoad}
                  alt="uploaded"
                  className="block w-full h-full object-contain select-none"
                  draggable={false}
                />
                {/* 文字ボックス */}
                {boxes.map((b, i) => (
                  <div
                    key={`${b.description}-${i}`}
                    style={styleFromBox(b)}
                    onClick={() => setSelectedText(b.description)}
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

      {/* === チェックリストUI（既存維持） === */}
      <section className="flex flex-col items-center gap-4">
        <ChecklistButton />
        <ChecklistPanel />
      </section>

      {/* === 既存ボタン（そのまま） === */}
      <div className="flex gap-3">
        <Button href="/page2" variant="green">
          写真を変える
        </Button>
        <Button href="/" variant="gray">
          ホームに戻る
        </Button>
      </div>

      {/* === 下部ポップアップ（選択テキストの説明） === */}
      {selectedText && (
        <div className="fixed bottom-0 left-0 right-0 bg-white p-6 pb-14 shadow-xl z-30 text-lg">
          <button
            onClick={() => setSelectedText("")}
            className="absolute top-2 right-3 text-red-600 text-3xl leading-none"
            aria-label="閉じる"
          >
            ×
          </button>
          <h2 className="font-bold mb-1">選択された料理</h2>
          <p className="mb-3 break-words">{selectedText}</p>
          <h2 className="font-bold">説明</h2>
          <p className="whitespace-pre-wrap">
            {selectedDescription || "説明は見つかりませんでした"}
          </p>
        </div>
      )}
    </main>
  );
}
