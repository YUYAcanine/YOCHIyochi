"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { canon } from "@/lib/textNormalize";
import Ribbon from "@/components/Ribbon";
import BottomDrawer from "@/components/BottomDrawer";
import PhaseSelectDropdown from "@/components/PhaseSelectDropdown";
import { PHASE_LABELS } from "@/components/checklist";
import { useMenuData } from "@/hooks/useMenuData";
import { useAccidentInfo } from "@/hooks/useAccidentInfo";
import { trackGaEvent } from "@/lib/ga";
import type { PhaseKey } from "@/types/food";

type Variant = "forbidden" | "ok" | "none";
type MenuInfo = Partial<Record<PhaseKey, string>>;

type FoodItem = MenuInfo & {
  food_name: string;
};

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [phase, setPhase] = useState<PhaseKey>("phase1");
  const [isClient, setIsClient] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);

  const { menuMap, foodIdMap, canonicalNameMap } = useMenuData(memberId);
  const { accidentInfo, showAccidentInfo, fetchByFoodId, reset } = useAccidentInfo();

  const buildMatchedFoods = (rawQuery: string, limit?: number): FoodItem[] => {
    const trimmed = rawQuery.trim();
    if (!trimmed) return [];

    const query = canon(trimmed);
    const results: FoodItem[] = [];
    const seen = new Set<string>();

    for (const [key, value] of Object.entries(menuMap)) {
      if (key.includes(query) || query.includes(key)) {
        const displayName = canonicalNameMap[key] ?? key;
        const resultKey = String(foodIdMap[key] ?? displayName);
        if (seen.has(resultKey)) continue;
        seen.add(resultKey);
        results.push({
          food_name: displayName,
          ...value,
        });
      }
    }

    return typeof limit === "number" ? results.slice(0, limit) : results;
  };

  const liveSuggestions = useMemo(() => buildMatchedFoods(searchQuery, 8), [searchQuery, menuMap]);

  useEffect(() => {
    setIsClient(true);
    const storedMemberId = localStorage.getItem("yochiMemberId");
    setMemberId(storedMemberId);
  }, []);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    const results = buildMatchedFoods(searchQuery);

    setSearchResults(results);
    setHasSearched(true);
    setShowSuggestions(false);
    trackGaEvent("search_food", {
      search_term: searchQuery.trim(),
      result_count: results.length,
    });
  };

  const handleSelectFood = (food: FoodItem, source: "search_result" | "suggestion" = "search_result") => {
    setSelectedFood(food);
    reset();
    trackGaEvent("tap_food", {
      food_name: food.food_name,
      source,
    });
  };

  const handleShowAccidentInfo = async () => {
    if (!selectedFood) return;

    if (showAccidentInfo) {
      reset();
      return;
    }

    const key = canon(selectedFood.food_name);
    const foodId = key ? foodIdMap[key] : null;
    await fetchByFoodId(foodId ?? null, memberId);
  };

  const classify = (food: FoodItem | null): { variant: Variant; text: string } => {
    const val = food?.[phase]?.trim();
    if (!val) return { variant: "none", text: "" };
    if (val === "食べさせてはいけません。" || val === "食べさせてはいけません") {
      return { variant: "forbidden", text: "食べさせてはいけません。" };
    }
    return { variant: "ok", text: val };
  };

  const selected = selectedFood
    ? classify(selectedFood)
    : { variant: "none" as Variant, text: "" };

  const handleCloseDrawer = () => {
    setSelectedFood(null);
    reset();
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
        rightContent={
          memberId ? (
            <span className="text-sm font-semibold text-[#6B5A4E]">
              {memberId}さんのページ
            </span>
          ) : null
        }
      />

      <div className="flex-grow pt-24 px-4">
        <div className="max-w-2xl mx-auto">
          <PhaseSelectDropdown
            phase={phase}
            onChangePhase={setPhase}
            labels={PHASE_LABELS}
            className="mb-4 mt-6 flex justify-end"
          />

          <div className="mb-8 mt-6">
            <div className="flex gap-2">
              <div className="flex-1 relative">
	                <input
	                  type="text"
	                  value={isClient ? searchQuery : ""}
	                  onFocus={() => setShowSuggestions(true)}
	                  onBlur={() => setTimeout(() => setShowSuggestions(false), 80)}
	                  onChange={(e) => {
	                    setSearchQuery(e.target.value);
	                    setShowSuggestions(true);
	                    if (hasSearched) setHasSearched(false);
	                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                      handleSearch();
                    }
                  }}
                  placeholder="食材名を入力してください"
                  disabled={!isClient}
                  className="w-full px-4 py-3 pr-10 border border-[#D3C5B9] rounded-xl bg-white text-[#4D3F36] placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#9c7b6c]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setShowSuggestions(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                    aria-label="入力をクリア"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                {isClient && showSuggestions && searchQuery.trim().length > 0 && liveSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-[calc(100%+0.4rem)] z-20 max-h-64 overflow-y-auto rounded-xl border border-[#D3C5B9] bg-white shadow-lg">
                    {liveSuggestions.map((food, index) => (
                      <button
                        key={`suggest-${food.food_name}-${index}`}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setSearchQuery(food.food_name);
                          setSearchResults(buildMatchedFoods(food.food_name));
                          setHasSearched(true);
                          setShowSuggestions(false);
                          trackGaEvent("tap_food", {
                            food_name: food.food_name,
                            source: "suggestion",
                          });
                        }}
                        className="block w-full border-b border-[#F0E4D8] px-4 py-3 text-left text-sm text-[#4D3F36] hover:bg-[#F8E8E8] last:border-b-0"
                      >
                        {food.food_name}
                      </button>
                    ))}
                  </div>
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
                aria-label="検索"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {hasSearched && (
            <div className="mb-8">
              {searchResults.length > 0 ? (
                <div>
                  <h2 className="text-base font-semibold text-[#3A2C25] mb-4">検索結果</h2>
                  <div className="space-y-2">
                    {searchResults.map((food, index) => (
                      <button
                        key={`${food.food_name}-${index}`}
                        onClick={() => handleSelectFood(food, "search_result")}
                        className="w-full p-4 text-left bg-white border border-[#D3C5B9] rounded-xl hover:bg-[#F8E8E8] transition text-[#4D3F36]"
                      >
                        {food.food_name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-[#6B7280] text-base">検索結果がありません。</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <BottomDrawer
        openText={selectedFood?.food_name || ""}
        cookDescription={selected.text}
        childDescription=""
        phase={phase}
        variant={selected.variant}
        cookVariant={selected.variant}
        onClose={handleCloseDrawer}
        onShowAccidentInfo={handleShowAccidentInfo}
        accidentInfo={accidentInfo}
        showAccidentInfo={showAccidentInfo}
      />
    </main>
  );
}
