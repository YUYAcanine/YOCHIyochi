/**
 * useAccidentInfo
 *
 * 選択された食材に紐づく事故情報を取得・管理するカスタムフック。
 **/

"use client";

import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type AccidentRow = {
  description_accident: string | null;
};

export function useAccidentInfo() {
  const [accidentInfo, setAccidentInfo] = useState<string>("");
  const [showAccidentInfo, setShowAccidentInfo] = useState<boolean>(false);

  const reset = useCallback(() => {
    setAccidentInfo("");
    setShowAccidentInfo(false);
  }, []);

  const fetchByFoodId = useCallback(async (foodId: number | null) => {
    if (!foodId) {
      setAccidentInfo("該当する食材の事故情報が見つかりません。");
      setShowAccidentInfo(true);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("yochiyochi_accidentlist")
        .select("description_accident")
        .eq("food_id", foodId);

      if (error) {
        setAccidentInfo("事故情報の取得でエラーが発生しました。");
        setShowAccidentInfo(true);
        return;
      }

      const rows = (data ?? []) as unknown as AccidentRow[];
      if (!rows.length) {
        setAccidentInfo("事故情報が見つかりません。");
        setShowAccidentInfo(true);
        return;
      }

      const descriptions = rows
        .map((row, i) => `${i + 1}. ${row.description_accident ?? ""}`.trim())
        .filter((s) => s !== "")
        .join("\n\n");

      setAccidentInfo(descriptions || "事故情報が見つかりません。");
      setShowAccidentInfo(true);
    } catch (e) {
      console.error("useAccidentInfo error:", e);
      setAccidentInfo("事故情報の取得に失敗しました。");
      setShowAccidentInfo(true);
    }
  }, []);

  return { accidentInfo, showAccidentInfo, fetchByFoodId, reset };
}
