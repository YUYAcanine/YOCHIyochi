/**
 * useAnalytics
 *
 * Google Analytics（gtag）へのイベント送信をラップするカスタムフック。
 *
 * - 画像選択（カメラ／ファイル）の計測
 * - OCR文字選択の計測
 *
 * gtag が存在しない環境でもエラーにならないよう、
 * 安全にイベント送信を行う薄いラッパーとして実装している。
**/

"use client";

import * as gtag from "@/lib/gtag";

export function useAnalytics() {
  const safeEvent = (payload: { action: string; category: string; label?: string }) => {
    try {
      // gtag 実装が無い環境（ローカル等）でも落とさない
      if (typeof window === "undefined") return;
      gtag.event(payload);
    } catch {
      // noop
    }
  };

  const trackImageSelected = (source: "camera" | "file", fileName: string) => {
    safeEvent({
      action: source === "camera" ? "camera_upload_selected" : "file_upload_selected",
      category: "engagement",
      label: fileName,
    });
  };

  const trackOcrTextSelected = (text: string) => {
    safeEvent({
      action: "ocr_text_selected",
      category: "engagement",
      label: text,
    });
  };

  return { trackImageSelected, trackOcrTextSelected };
}
