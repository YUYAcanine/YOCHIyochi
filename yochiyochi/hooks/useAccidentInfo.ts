"use client";

import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type AccidentRow = {
  accident_detail: string | null;
};

type HiyariRow = {
  accident_content: string | null;
  created_at: string;
};

const toGardenId = (memberId: string): number | null => {
  const digits = memberId.replace(/\D/g, "");
  if (!digits) return null;
  const value = Number(digits);
  if (!Number.isFinite(value)) return null;
  return value;
};

export function useAccidentInfo() {
  const [accidentInfo, setAccidentInfo] = useState<string>("");
  const [showAccidentInfo, setShowAccidentInfo] = useState<boolean>(false);

  const reset = useCallback(() => {
    setAccidentInfo("");
    setShowAccidentInfo(false);
  }, []);

  const fetchByFoodId = useCallback(
    async (foodId: number | null, memberId?: string | null) => {
      if (!foodId) {
        setAccidentInfo("事故情報が見つかりません。");
        setShowAccidentInfo(true);
        return;
      }

      try {
        const accidentPromise = supabase
          .from("A_accident")
          .select("accident_detail")
          .eq("food_id", foodId);

        let hiyariQuery = supabase
          .from("B_accident")
          .select("accident_content, created_at")
          .eq("food_id", foodId)
          .order("created_at", { ascending: false })
          .limit(5);

        const gardenId = memberId ? toGardenId(memberId) : null;
        if (gardenId != null) {
          const { data: enjiRows } = await supabase
            .from("B_enji")
            .select("id")
            .eq("garden_id", gardenId);
          const enjiIds = ((enjiRows ?? []) as Array<{ id: number }>).map((row) => row.id);
          if (enjiIds.length > 0) {
            hiyariQuery = hiyariQuery.in("enji_id", enjiIds);
          } else {
            hiyariQuery = hiyariQuery.eq("enji_id", -1);
          }
        }

        const [
          { data: accidentData, error: accidentError },
          { data: hiyariData, error: hiyariError },
        ] = await Promise.all([accidentPromise, hiyariQuery]);

        const sections: string[] = [];

        if (!accidentError) {
          const rows = (accidentData ?? []) as AccidentRow[];
          const descriptions = rows
            .map((row, i) => `${i + 1}. ${row.accident_detail ?? ""}`.trim())
            .filter((s) => s !== "")
            .join("\n\n");
          if (descriptions) {
            sections.push(`事故情報\n${descriptions}`);
          }
        }

        if (!hiyariError) {
          const rows = (hiyariData ?? []) as HiyariRow[];
          const hiyariLines = rows
            .map((row, i) => `${i + 1}. ${row.accident_content ?? ""}`.trim())
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

