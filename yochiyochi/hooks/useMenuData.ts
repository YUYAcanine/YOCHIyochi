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
  id: number | string;
  food_name: string | null;
  phase1: string | null;
  phase2: string | null;
  phase3: string | null;
  phase4: string | null;
  phase5: string | null;
};

type BCookRow = {
  food_id: number | string;
  food_name: string | null;
  phase1: string | null;
  phase2: string | null;
  phase3: string | null;
  phase4: string | null;
  phase5: string | null;
};

const toGardenId = (memberId: string): number | null => {
  const digits = memberId.replace(/\D/g, "");
  if (!digits) return null;
  const value = Number(digits);
  if (!Number.isFinite(value)) return null;
  return value;
};

export function useMenuData(memberId?: string | null, reloadTick?: number) {
  const [menuMap, setMenuMap] = useState<Record<string, MenuInfo>>({});
  const [foodIdMap, setFoodIdMap] = useState<Record<string, number>>({});
  const [cookIdMap, setCookIdMap] = useState<Record<string, number>>({});
  const [foodNameOptions, setFoodNameOptions] = useState<string[]>([]);
  const [eventTick, setEventTick] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onCookUpdated = () => setEventTick((prev) => prev + 1);
    window.addEventListener("yochi-cook-updated", onCookUpdated);
    return () => window.removeEventListener("yochi-cook-updated", onCookUpdated);
  }, []);

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
        const idToKey = new Map<string, string>();
        const nameSet = new Set<string>();

        for (const row of rows) {
          const displayName = (row.food_name ?? "").trim();
          if (displayName) {
            nameSet.add(displayName);
          }

          const key = canon(row.food_name ?? "");
          if (!key) continue;

          const numericId = Number(row.id);
          if (!Number.isFinite(numericId)) continue;
          idMap[key] = numericId;
          idToKey.set(String(row.id), key);
          map[key] = {
            phase1: row.phase1?.trim() ?? undefined,
            phase2: row.phase2?.trim() ?? undefined,
            phase3: row.phase3?.trim() ?? undefined,
            phase4: row.phase4?.trim() ?? undefined,
            phase5: row.phase5?.trim() ?? undefined,
          };
        }

        if (memberId) {
          const gardenId = toGardenId(memberId);
          if (gardenId != null) {
            const { data: bCookData, error: bCookError } = await supabase
              .from("B_cook")
              .select("food_id, food_name, phase1, phase2, phase3, phase4, phase5")
              .eq("garden_id", gardenId);

            if (!bCookError && bCookData) {
              const overrides = bCookData as unknown as BCookRow[];
              for (const row of overrides) {
                const keyFromFoodId = idToKey.get(String(row.food_id));
                const keyFromName = canon(row.food_name ?? "");
                const key = keyFromFoodId ?? (keyFromName || undefined);
                if (!key) continue;

                const displayName = (row.food_name ?? "").trim();
                if (displayName) {
                  nameSet.add(displayName);
                }

                map[key] = {
                  ...map[key],
                  phase1: row.phase1?.trim() ?? map[key]?.phase1,
                  phase2: row.phase2?.trim() ?? map[key]?.phase2,
                  phase3: row.phase3?.trim() ?? map[key]?.phase3,
                  phase4: row.phase4?.trim() ?? map[key]?.phase4,
                  phase5: row.phase5?.trim() ?? map[key]?.phase5,
                };
              }
            }
          }
        }

        if (cancelled) return;
        setMenuMap(map);
        setFoodIdMap(idMap);
        setCookIdMap({});
        setFoodNameOptions(
          Array.from(nameSet).sort((a, b) => a.localeCompare(b, "ja"))
        );
      } catch (e) {
        console.error("useMenuData error:", e);
      }
    }

    fetchMenuData();
    return () => {
      cancelled = true;
    };
  }, [memberId, reloadTick, eventTick]);

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

  return { menuMap, foodIdMap, cookIdMap, foodNameOptions, updateMenuForKey };
}
