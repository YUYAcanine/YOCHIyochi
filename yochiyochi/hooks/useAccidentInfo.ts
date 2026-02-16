"use client";

import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type AccidentRow = {
  description_accident: string | null;
};

type MealRecordRow = {
  food_name: string;
  detail: string | null;
  created_at: string;
};

export function useAccidentInfo() {
  const [accidentInfo, setAccidentInfo] = useState<string>("");
  const [showAccidentInfo, setShowAccidentInfo] = useState<boolean>(false);

  const reset = useCallback(() => {
    setAccidentInfo("");
    setShowAccidentInfo(false);
  }, []);

  const fetchByFoodId = useCallback(
    async (foodId: number | null, _memberId?: string | null) => {
      if (!foodId) {
        setAccidentInfo("該当する食材の事故情報が見つかりません。");
        setShowAccidentInfo(true);
        return;
      }

      try {
        const accidentPromise = supabase
          .from("yochiyochi_accidentlist")
          .select("description_accident")
          .eq("food_id", foodId);

        const hiyariQuery = supabase
          .from("yochiyochi_meal_records")
          .select("food_name, detail, created_at")
          .eq("record_type", "hiyari")
          .eq("food_id", foodId)
          .order("created_at", { ascending: false })
          .limit(5);

        const [
          { data: accidentData, error: accidentError },
          { data: hiyariData, error: hiyariError },
        ] = await Promise.all([accidentPromise, hiyariQuery]);

        const sections: string[] = [];

        if (!accidentError) {
          const rows = (accidentData ?? []) as unknown as AccidentRow[];
          const descriptions = rows
            .map((row, i) => `${i + 1}. ${row.description_accident ?? ""}`.trim())
            .filter((s) => s !== "")
            .join("\n\n");
          if (descriptions) {
            sections.push(`事故情報\n${descriptions}`);
          }
        }

        if (!hiyariError) {
          const rows = (hiyariData ?? []) as unknown as MealRecordRow[];
          const hiyariLines = rows
            .map((row) => {
              const detail = row.detail ? `：${row.detail}` : "";
              return `・${row.food_name}${detail}`;
            })
            .filter(Boolean)
            .join("\n");
          if (hiyariLines) {
            sections.push(`ヒヤリハット\n${hiyariLines}`);
          }
        }

        if (sections.length === 0) {
          setAccidentInfo("事故情報が見つかりません。");
        } else {
          setAccidentInfo(sections.join("\n\n"));
        }
        setShowAccidentInfo(true);
      } catch (e) {
        console.error("useAccidentInfo error:", e);
        setAccidentInfo("事故情報の取得に失敗しました。");
        setShowAccidentInfo(true);
      }
    },
    []
  );

  return { accidentInfo, showAccidentInfo, fetchByFoodId, reset };
}
