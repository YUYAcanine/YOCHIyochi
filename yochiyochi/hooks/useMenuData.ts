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

type ACookRow = {
  id: number;
  food_name: string | null;
  phase1: string | null;
  phase2: string | null;
  phase3: string | null;
  phase4: string | null;
  phase5: string | null;
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
        const { data, error } = await supabase
          .from("A_cook")
          .select("id, food_name, phase1, phase2, phase3, phase4, phase5");

        if (error || !data || cancelled) return;

        const rows = data as unknown as ACookRow[];
        const map: Record<string, MenuInfo> = {};
        const idMap: Record<string, number> = {};
        const idToKey = new Map<number, string>();

        for (const row of rows) {
          const key = canon(row.food_name ?? "");
          if (!key) continue;

          idMap[key] = row.id;
          idToKey.set(row.id, key);
          map[key] = {
            phase1: row.phase1?.trim() ?? undefined,
            phase2: row.phase2?.trim() ?? undefined,
            phase3: row.phase3?.trim() ?? undefined,
            phase4: row.phase4?.trim() ?? undefined,
            phase5: row.phase5?.trim() ?? undefined,
          };
        }

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
        setCookIdMap({});
      } catch (e) {
        console.error("useMenuData error:", e);
      }
    }

    fetchMenuData();
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  const updateMenuForKey = (
    key: string,
    phaseKey: keyof MenuInfo,
    value: string | null
  ) => {
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
