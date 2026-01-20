/**
 * useMenuData
 *
 * 食材名をキーとして、成長フェーズ別の注意情報を取得・整形するカスタムフック。
 **/

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { canon } from "@/lib/textNormalize";

export type MenuInfo = {
  phase1?: string;
  phase2?: string;
  phase3?: string;
  phase4?: string;
  phase5?: string;
};

type FoodRow = {
  food_id: number;
  food_name: string | null;
  cook_id: number | null;
};

type CookRow = {
  cook_id: number;
  description_phase1: string | null;
  description_phase2: string | null;
  description_phase3: string | null;
  description_phase4: string | null;
  description_phase5: string | null;
};

type FallbackRow = {
  food_name: string | null;
  description_phase1: string | null;
  description_phase2: string | null;
  description_phase3: string | null;
  description_phase4: string | null;
  description_phase5: string | null;
};

type OverrideRow = {
  food_id: number;
  phase: string;
  description: string | null;
};

export function useMenuData(memberId?: string | null) {
  const [menuMap, setMenuMap] = useState<Record<string, MenuInfo>>({});
  const [foodIdMap, setFoodIdMap] = useState<Record<string, number>>({});
  const [cookIdMap, setCookIdMap] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;

    async function fetchMenuData() {
      try {
        // 1) foodlist
        const { data: foodData, error: foodError } = await supabase
          .from("yochiyochi_foodlist")
          .select("food_id, food_name, cook_id");

        // Supabase型が未生成でも any にしないために unknown で受けて詰め替え
        const foods = (foodData ?? []) as unknown as FoodRow[];

        // foodlist が取れない場合はフォールバック
        if (foodError) {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("NagasakiDemoData")
            .select(
              "food_name, description_phase1, description_phase2, description_phase3, description_phase4, description_phase5"
            );

          if (fallbackError || !fallbackData || cancelled) return;

          const rows = fallbackData as unknown as FallbackRow[];
          const map: Record<string, MenuInfo> = {};

          for (const row of rows) {
            const key = canon(row.food_name ?? "");
            if (!key) continue;

            map[key] = {
              phase1: row.description_phase1?.trim() ?? undefined,
              phase2: row.description_phase2?.trim() ?? undefined,
              phase3: row.description_phase3?.trim() ?? undefined,
              phase4: row.description_phase4?.trim() ?? undefined,
              phase5: row.description_phase5?.trim() ?? undefined,
            };
          }

          if (cancelled) return;
          setMenuMap(map);
          setFoodIdMap({});
          setCookIdMap({});
          return;
        }

        if (!foods.length || cancelled) return;

        // 2) cooklist
        const { data: cookData, error: cookError } = await supabase
          .from("yochiyochi_cooklist")
          .select(
            "cook_id, description_phase1, description_phase2, description_phase3, description_phase4, description_phase5"
          );

        if (cookError || !cookData || cancelled) return;

        const cooks = cookData as unknown as CookRow[];

        // cook_id -> cookInfo
        const cookMap = new Map<number, CookRow>();
        for (const cook of cooks) {
          cookMap.set(cook.cook_id, cook);
        }

        // 3) 結合
        const map: Record<string, MenuInfo> = {};
        const idMap: Record<string, number> = {};
        const cookMapByFood: Record<string, number> = {};
        const idToKey = new Map<number, string>();

        for (const food of foods) {
          const key = canon(food.food_name ?? "");
          if (!key) continue;

          idMap[key] = food.food_id;
          idToKey.set(food.food_id, key);
          if (food.cook_id != null) {
            cookMapByFood[key] = food.cook_id;
          }

          if (food.cook_id == null) continue;
          const cookInfo = cookMap.get(food.cook_id);
          if (!cookInfo) continue;

          map[key] = {
            phase1: cookInfo.description_phase1?.trim() ?? undefined,
            phase2: cookInfo.description_phase2?.trim() ?? undefined,
            phase3: cookInfo.description_phase3?.trim() ?? undefined,
            phase4: cookInfo.description_phase4?.trim() ?? undefined,
            phase5: cookInfo.description_phase5?.trim() ?? undefined,
          };
        }

        // 4) 会員ごとの上書き
        if (memberId) {
          const { data: overrideData, error: overrideError } = await supabase
            .from("yochiyochi_cook_overrides")
            .select("food_id, phase, description")
            .eq("member_id", memberId);

          if (!overrideError && overrideData) {
            const overrides = overrideData as unknown as OverrideRow[];
            for (const row of overrides) {
              const key = idToKey.get(row.food_id);
              if (!key) continue;
              const phaseKey = row.phase as keyof MenuInfo;
              if (!phaseKey) continue;
              map[key] = {
                ...map[key],
                [phaseKey]: row.description?.trim() ?? undefined,
              };
            }
          }
        }

        if (cancelled) return;
        setMenuMap(map);
        setFoodIdMap(idMap);
        setCookIdMap(cookMapByFood);
      } catch (e) {
        console.error("useMenuData error:", e);
      }
    }

    fetchMenuData();
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  const updateMenuForKey = (key: string, phaseKey: keyof MenuInfo, value: string | null) => {
    setMenuMap((prev) => {
      const current = prev[key] ?? {};
      return {
        ...prev,
        [key]: {
          ...current,
          [phaseKey]: value ?? undefined,
        },
      };
    });
  };

  return { menuMap, foodIdMap, cookIdMap, updateMenuForKey };
}
