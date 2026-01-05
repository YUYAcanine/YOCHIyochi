"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { canon } from "@/lib/textNormalize";
import Ribbon from "@/components/Ribbon";
import BottomDrawer from "@/components/BottomDrawer";
import type { PhaseKey } from "@/types/food";

type Variant = "forbidden" | "ok" | "none";

type MenuInfo = Partial<Record<PhaseKey, string>>;

type FoodItem = MenuInfo & {
  food_name: string;
};

type FoodRow = {
  food_id: number;
  food_name: string;
  cook_id: number | null;
};

type CookRow = {
  cook_id: number;
  description_phase1?: string | null;
  description_phase2?: string | null;
  description_phase3?: string | null;
  description_phase4?: string | null;
  description_phase5?: string | null;
};

type FallbackRow = {
  food_name: string;
  description_phase1?: string | null;
  description_phase2?: string | null;
  description_phase3?: string | null;
  description_phase4?: string | null;
  description_phase5?: string | null;
};

export default function Page6() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [menuMap, setMenuMap] = useState<Record<string, MenuInfo>>({});
  const [foodIdMap, setFoodIdMap] = useState<Record<string, number>>({});
  const [accidentInfo, setAccidentInfo] = useState<string>("");
  const [showAccidentInfo, setShowAccidentInfo] = useState(false);
  const [phase, setPhase] = useState<PhaseKey>("phase1");
  const [isClient, setIsClient] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // クライアントサイドでのみ実行
  useEffect(() => {
    setIsClient(true);
  }, []);

  // データを取得
  useEffect(() => {
    if (!isClient) return;

    async function fetchMenuData() {
      try {
        const { data: foodDataRaw, error: foodError } = await supabase
          .from("yochiyochi_foodlist")
          .select("food_id, food_name, cook_id");
        const foodData = (foodDataRaw ?? []) as FoodRow[];

        if (foodError) {
          const { data: fallbackDataRaw, error: fallbackError } = await supabase
            .from("NagasakiDemoData")
            .select("*");
          const fallbackData = (fallbackDataRaw ?? []) as FallbackRow[];

          if (fallbackError || !fallbackData) return;

          const map: Record<string, MenuInfo> = {};
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

        const { data: cookDataRaw, error: cookError } = await supabase
          .from("yochiyochi_cooklist")
          .select(
            "cook_id, description_phase1, description_phase2, description_phase3, description_phase4, description_phase5"
          );
        const cookData = (cookDataRaw ?? []) as CookRow[];

        if (cookError || !cookData || cookData.length === 0) return;

        const cookMap = new Map<number, CookRow>();
        for (const cook of cookData) {
          if (cook.cook_id == null) continue;
          cookMap.set(cook.cook_id, cook);
        }

        const map: Record<string, MenuInfo> = {};
        const foodIdMap: Record<string, number> = {};

        for (const food of foodData) {
          const key = canon(food.food_name);
          if (!key) continue;
          if (food.cook_id == null) continue;

          foodIdMap[key] = food.food_id;

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
  }, [isClient]);

  // 検索実行
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const query = canon(searchQuery.trim());
    const results: FoodItem[] = [];

    for (const [key, value] of Object.entries(menuMap)) {
      if (key.includes(query) || query.includes(key)) {
        results.push({
          food_name: key,
          ...value,
        });
      }
    }

    setSearchResults(results);
    setHasSearched(true);
  };

  // 食材選択
  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    setAccidentInfo("");
    setShowAccidentInfo(false);
  };

  // 事故情報を取得
  const handleShowAccidentInfo = async () => {
    if (!selectedFood) return;

    if (showAccidentInfo) {
      setShowAccidentInfo(false);
      return;
    }

    const key = canon(selectedFood.food_name);
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

  // 調理法の分類
  const classify = (food: FoodItem | null): { variant: Variant; text: string } => {
    const val = food?.[phase]?.trim();
    if (!val) return { variant: "none", text: "" };
    if (val === "食べさせてはいけません。")
      return { variant: "forbidden", text: "食べさせてはいけません" };
    return { variant: "ok", text: val };
  };

  const selected = selectedFood
    ? classify(selectedFood)
    : { variant: "none" as Variant, text: "" };

  // パネルを閉じる
  const handleCloseDrawer = () => {
    setSelectedFood(null);
    setAccidentInfo("");
    setShowAccidentInfo(false);
  };

  return (
    <main className="min-h-screen bg-[#FAF8F6] text-[#4D3F36] relative flex flex-col">
      <Ribbon
        href="/"
        logoSrc="/yoyochi.jpg"
        alt="よちヨチ ロゴ"
        heightClass="h-24"
        bgClass="bg-[#F0E4D8]"
        logoClassName="h-20 w-auto object-contain"
      />

      <div className="flex-grow pt-24 px-4">
        <div className="max-w-2xl mx-auto">
          {/* 検索バー */}
          <div className="mb-8 mt-8">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={isClient ? searchQuery : ""}  // ← SSRでも常にcontrolled
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (hasSearched) setHasSearched(false);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="食材名を入力してください"
                  disabled={!isClient}
                  className="w-full px-4 py-3 pr-10 border border-[#D3C5B9] rounded-xl 
                             bg-white text-[#4D3F36] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#9c7b6c]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <button
                onClick={handleSearch}
                disabled={!isClient}
                className={`px-6 py-3 rounded-xl font-medium transition ${
                  isClient
                    ? "bg-[#9c7b6c] hover:bg-[#a88877] text-white"
                    : "bg-[#9c7b6c] text-white opacity-50"
                }`}
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 検索結果 */}
          {hasSearched && (
            <div className="mb-8">
              {searchResults.length > 0 ? (
                <div>
                  <h2 className="text-base font-semibold text-[#3A2C25] mb-4">
                    検索結果
                  </h2>
                  <div className="space-y-2">
                    {searchResults.map((food, index) => (
                      <button
                        key={index}
                        onClick={() => handleSelectFood(food)}
                        className="w-full p-4 text-left bg-white border border-[#D3C5B9] rounded-xl 
                                   hover:bg-[#F8E8E8] transition text-[#4D3F36]"
                      >
                        {food.food_name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-[#6B7280] text-base">
                    検索結果がありません。
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 年齢選択 */}
          {selectedFood && (
            <div className="mb-6">
              <h3 className="text-base font-semibold text-[#3A2C25] mb-4">
                お子様の年齢を選択してください
              </h3>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { key: "phase1", label: "5-6ヶ月" },
                  { key: "phase2", label: "7-8ヶ月" },
                  { key: "phase3", label: "9-11ヶ月" },
                  { key: "phase4", label: "1-1.5歳" },
                  { key: "phase5", label: "1.5-2歳" },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setPhase(key as PhaseKey)}
                    className={`px-3 py-2 text-sm rounded-lg font-medium transition ${
                      phase === key
                        ? "bg-[#9c7b6c] text-white"
                        : "bg-white border border-[#D3C5B9] text-[#4D3F36] hover:bg-[#F8E8E8]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomDrawer
        openText={selectedFood?.food_name || ""}
        description={selected.text}
        phase={phase}
        variant={selected.variant}
        onClose={handleCloseDrawer}
        onShowAccidentInfo={handleShowAccidentInfo}
        accidentInfo={accidentInfo}
        showAccidentInfo={showAccidentInfo}
      />
    </main>
  );
}

