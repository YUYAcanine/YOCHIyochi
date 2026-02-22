"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Pencil, Search } from "lucide-react";
import { useMenuData } from "@/hooks/useMenuData";
import { canon } from "@/lib/textNormalize";
import Ribbon from "@/components/Ribbon";

type RegisterTab = "child" | "cook" | "hiyari";

type AnswerItem = {
  id: number;
  child_name: string;
  age_month: number;
  no_eat: string;
  note: string | null;
  created_at: string;
};

type MealItem = {
  id: number;
  child_name: string;
  age_month: number;
  food_name: string;
  detail: string | null;
  record_type: "growth" | "hiyari";
  created_at: string;
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd} ${hh}:${mi}`;
};

export default function Page4() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<RegisterTab>("child");

  const [childName, setChildName] = useState("");
  const [ageMonth, setAgeMonth] = useState("");
  const [noEat, setNoEat] = useState("");
  const [note, setNote] = useState("");
  const [isNoEatChecked, setIsNoEatChecked] = useState(true);

  const [mealChildName, setMealChildName] = useState("");
  const [mealAgeMonth, setMealAgeMonth] = useState("");
  const [mealFood, setMealFood] = useState("");
  const [mealDetail, setMealDetail] = useState("");

  const [formMsg, setFormMsg] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [authChecked, setAuthChecked] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [expandedNames, setExpandedNames] = useState<Record<string, boolean>>({});

  const [answerItems, setAnswerItems] = useState<AnswerItem[]>([]);
  const [mealItems, setMealItems] = useState<MealItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  const { foodIdMap } = useMenuData();

  const mealFoodId = useMemo(() => {
    const key = canon(mealFood);
    if (!key) return null;
    return foodIdMap[key] ?? null;
  }, [mealFood, foodIdMap]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const loggedIn = localStorage.getItem("yochiLoggedIn") === "true";
    const storedMemberId = localStorage.getItem("yochiMemberId");
    if (!loggedIn || !storedMemberId) {
      router.replace("/Login");
      return;
    }
    setMemberId(storedMemberId);
    setAuthChecked(true);
  }, [router]);

  useEffect(() => {
    if (!memberId) return;

    let cancelled = false;
    const fetchAll = async () => {
      setListLoading(true);
      try {
        const [answersRes, mealsRes] = await Promise.all([
          fetch(`/api/answers?member_id=${encodeURIComponent(memberId)}`, {
            cache: "no-store",
          }),
          fetch(`/api/meal-records?member_id=${encodeURIComponent(memberId)}&limit=200`, {
            cache: "no-store",
          }),
        ]);

        if (!answersRes.ok || !mealsRes.ok) throw new Error("fetch failed");

        const answersJson = await answersRes.json();
        const mealsJson = await mealsRes.json();

        if (cancelled) return;

        const nextAnswers = (Array.isArray(answersJson) ? answersJson : answersJson.items ?? []) as AnswerItem[];
        const nextMeals = (Array.isArray(mealsJson) ? mealsJson : mealsJson.items ?? []) as MealItem[];

        setAnswerItems(nextAnswers);
        setMealItems(nextMeals);
      } catch {
        if (!cancelled) {
          setAnswerItems([]);
          setMealItems([]);
        }
      } finally {
        if (!cancelled) setListLoading(false);
      }
    };

    fetchAll();
    return () => {
      cancelled = true;
    };
  }, [memberId, reloadTick]);

  const childOptions = useMemo(() => {
    const names = [
      ...answerItems.map((item) => item.child_name),
      ...mealItems.map((item) => item.child_name),
    ]
      .map((name) => name.trim())
      .filter(Boolean);
    return Array.from(new Set(names));
  }, [answerItems, mealItems]);

  const namesForTab = useMemo(() => {
    const latestMap = new Map<string, number>();

    const addLatest = (name: string, createdAt: string) => {
      const t = new Date(createdAt).getTime();
      const prev = latestMap.get(name) ?? 0;
      if (t > prev) latestMap.set(name, t);
    };

    if (activeTab === "child") {
      for (const item of answerItems) addLatest(item.child_name, item.created_at);
      for (const item of mealItems.filter((item) => item.record_type === "hiyari")) {
        addLatest(item.child_name, item.created_at);
      }
    } else {
      const targetType = activeTab === "cook" ? "growth" : "hiyari";
      for (const item of mealItems.filter((item) => item.record_type === targetType)) {
        addLatest(item.child_name, item.created_at);
      }
    }

    return Array.from(latestMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)
      .filter((name) => name.toLowerCase().includes(searchText.trim().toLowerCase()));
  }, [activeTab, answerItems, mealItems, searchText]);

  useEffect(() => {
    if (namesForTab.length === 0) {
      setExpandedNames({});
      return;
    }

    setExpandedNames((prev) => {
      const next: Record<string, boolean> = {};
      for (const name of namesForTab) {
        next[name] = prev[name] ?? false;
      }
      return next;
    });
  }, [namesForTab]);

  if (!authChecked) return null;

  const toggleExpanded = (name: string) => {
    setExpandedNames((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const resetForms = () => {
    setChildName("");
    setAgeMonth("");
    setNoEat("");
    setNote("");
    setMealChildName("");
    setMealAgeMonth("");
    setMealFood("");
    setMealDetail("");
    setIsNoEatChecked(true);
    setFormMsg(null);
  };

  const openEditorForName = (name: string) => {
    const answer = answerItems.find((item) => item.child_name === name);
    const meal = mealItems.find((item) => item.child_name === name);
    const month = answer?.age_month ?? meal?.age_month ?? "";

    if (activeTab === "child") {
      setChildName(name);
      setAgeMonth(month ? String(month) : "");
      setNoEat(answer?.no_eat ?? "");
      setNote(answer?.note ?? "");
    } else {
      setMealChildName(name);
      setMealAgeMonth(month ? String(month) : "");
      setMealFood(meal?.food_name ?? "");
      setMealDetail(meal?.detail ?? "");
    }

    setShowForm(true);
    setFormMsg(null);
  };

  const handleChildSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    if (!childName || !ageMonth || !noEat || !memberId) {
      setFormMsg("すべての必須項目を入力してください。");
      return;
    }

    setSubmitLoading(true);
    try {
      const body = {
        child_name: childName,
        age_month: Number(ageMonth),
        no_eat: isNoEatChecked ? noEat : "",
        note,
        member_id: memberId,
      };

      const res = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("save failed");

      setFormMsg("登録しました。");
      setReloadTick((prev) => prev + 1);
      resetForms();
      setShowForm(false);
    } catch {
      setFormMsg("登録に失敗しました。");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleMealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    if (!mealChildName || !mealAgeMonth || !mealFood || !mealDetail || !memberId) {
      setFormMsg("すべての必須項目を入力してください。");
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await fetch("/api/meal-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_name: mealChildName,
          age_month: Number(mealAgeMonth),
          record_type: activeTab === "cook" ? "growth" : "hiyari",
          food_name: mealFood,
          detail: mealDetail,
          food_id: mealFoodId,
          member_id: memberId,
        }),
      });

      if (!res.ok) throw new Error("save failed");

      setFormMsg("登録しました。");
      setReloadTick((prev) => prev + 1);
      resetForms();
      setShowForm(false);
    } catch {
      setFormMsg("登録に失敗しました。");
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderChildPanel = (name: string) => {
    const noEatItems = answerItems.filter((item) => item.child_name === name);
    const hiyariItems = mealItems.filter(
      (item) => item.child_name === name && item.record_type === "hiyari"
    );
    const month = noEatItems[0]?.age_month ?? hiyariItems[0]?.age_month ?? "-";

    return (
      <div key={name} className="rounded-md bg-[#F3F3F3] p-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => toggleExpanded(name)}
            className="flex items-center gap-2 text-left text-lg font-bold text-[#2f2a27]"
          >
            {name}
            {expandedNames[name] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          <button
            type="button"
            onClick={() => openEditorForName(name)}
            className="rounded p-1 text-[#2f2a27] hover:bg-[#e7ddd3]"
            aria-label={`${name}を編集`}
          >
            <Pencil size={18} />
          </button>
        </div>

        {expandedNames[name] && (
          <div className="mt-4 space-y-5">
            <div className="flex items-center justify-between text-[#2f2a27]">
              <h3 className="text-lg font-bold">注意する食材</h3>
              <span className="text-lg font-semibold">月齢 : {month}</span>
            </div>

            {noEatItems.length > 0 ? (
              <div className="space-y-2">
                {noEatItems.map((item) => (
                  <div key={item.id} className="rounded-md bg-[#f3e9e9] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-bold text-[#2f2a27]">{item.no_eat}</p>
                        {item.note && <p className="text-sm text-[#2f2a27]">{item.note}</p>}
                      </div>
                      <p className="text-xl font-semibold text-[#dd3019]">食べられない</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#6b5a4e]">未登録です。</p>
            )}

            <div>
              <h3 className="mb-2 text-lg font-bold text-[#2f2a27]">ヒヤリハット</h3>
              {hiyariItems.length > 0 ? (
                <div className="space-y-2">
                  {hiyariItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="rounded-md bg-[#efe4c5] p-3">
                      <p className="text-base font-bold text-[#2f2a27]">{item.food_name}</p>
                      {item.detail && <p className="text-sm text-[#2f2a27]">{item.detail}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#6b5a4e]">ヒヤリハット記録はありません。</p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMealPanel = (name: string, type: "growth" | "hiyari") => {
    const items = mealItems.filter(
      (item) => item.child_name === name && item.record_type === type
    );
    const month = items[0]?.age_month ?? "-";

    return (
      <div key={name} className="rounded-md bg-[#F3F3F3] p-4">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => toggleExpanded(name)}
            className="flex items-center gap-2 text-left text-lg font-bold text-[#2f2a27]"
          >
            {name}
            {expandedNames[name] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          <button
            type="button"
            onClick={() => openEditorForName(name)}
            className="rounded p-1 text-[#2f2a27] hover:bg-[#e7ddd3]"
            aria-label={`${name}を編集`}
          >
            <Pencil size={18} />
          </button>
        </div>

        {expandedNames[name] && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-[#2f2a27]">
              <h3 className="text-lg font-bold">
                {type === "growth" ? "調理方法" : "ヒヤリハット"}
              </h3>
              <span className="text-lg font-semibold">月齢 : {month}</span>
            </div>
            {items.length > 0 ? (
              items.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className={`rounded-md p-3 ${
                    type === "growth" ? "bg-[#eef1da]" : "bg-[#efe4c5]"
                  }`}
                >
                  <p className="text-base font-bold text-[#2f2a27]">{item.food_name}</p>
                  {item.detail && <p className="text-sm text-[#2f2a27]">{item.detail}</p>}
                  <p className="mt-1 text-xs text-[#6b5a4e]">{formatDateTime(item.created_at)}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-[#6b5a4e]">記録がありません。</p>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#FAF8F6] text-[#2f2a27]">
      <div className="mx-auto w-full max-w-4xl pb-8">
        <Ribbon
          href="/"
          logoSrc="/yoyochi.jpg"
          alt="よちヨチ ロゴ"
          heightClass="h-24"
          bgClass="bg-[#F0E4D8]"
          logoClassName="h-20 w-auto object-contain"
          rightContent={
            memberId ? (
              <p className="text-sm font-semibold text-[#2f2a27]">{memberId}さんのページ</p>
            ) : null
          }
        />

        <div className="px-3 pt-28 sm:px-5">
          <div className="grid grid-cols-3 gap-1 border-b-[6px] border-[#b79074]">
            <button
              type="button"
              onClick={() => setActiveTab("child")}
              className={`rounded-t-md py-2 text-base font-bold ${
                activeTab === "child" ? "bg-[#B79074] text-white" : "bg-[#ece4dc] text-[#7d7570]"
              }`}
            >
              園児情報
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("cook")}
              className={`rounded-t-md py-2 text-base font-bold ${
                activeTab === "cook" ? "bg-[#B79074] text-white" : "bg-[#ece4dc] text-[#7d7570]"
              }`}
            >
              調理方法
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("hiyari")}
              className={`rounded-t-md py-2 text-base font-bold ${
                activeTab === "hiyari" ? "bg-[#B79074] text-white" : "bg-[#ece4dc] text-[#7d7570]"
              }`}
            >
              ヒヤリハット
            </button>
          </div>

          <div className="mt-3 flex gap-1">
            <input
              type="text"
              placeholder="園児名を入力してください"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="h-12 w-full rounded-sm border-[3px] border-[#b79074] bg-[#FAF8F6] px-3 text-base outline-none placeholder:text-[#b7aea6]"
            />
            <button
              type="button"
              className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#B79074] text-white"
              aria-label="検索"
            >
              <Search size={26} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowForm((prev) => !prev);
              setFormMsg(null);
            }}
            className="mt-6 w-full rounded-sm bg-[#B79074] py-2 text-3xl font-bold text-white"
          >
            園児登録
          </button>

          {showForm && (
            <div className="rounded-b-md border-x-[3px] border-b-[3px] border-[#b79074] bg-[#f0f0f0] p-4">
              {activeTab === "child" ? (
                <form onSubmit={handleChildSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <label className="text-base font-bold text-[#2f2a27]">
                      園児名
                      <input
                        type="text"
                        list="child-name-options"
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        className="mt-1 h-11 w-full rounded border-[3px] border-[#7f7f7f] bg-transparent px-2"
                      />
                    </label>
                    <label className="text-base font-bold text-[#2f2a27]">
                      月齢
                      <input
                        type="number"
                        min={0}
                        value={ageMonth}
                        onChange={(e) => setAgeMonth(e.target.value)}
                        className="mt-1 h-11 w-full rounded border-[3px] border-[#7f7f7f] bg-transparent px-2"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-[1fr_auto] items-end gap-5">
                    <label className="text-base font-bold text-[#2f2a27]">
                      食材名 (選択)
                      <input
                        type="text"
                        value={noEat}
                        onChange={(e) => setNoEat(e.target.value)}
                        className="mt-1 h-11 w-full rounded border-[3px] border-[#7f7f7f] bg-transparent px-2"
                      />
                    </label>
                    <label className="mb-2 inline-flex items-center gap-2 text-2xl font-semibold text-[#2f2a27]">
                      <input
                        type="checkbox"
                        checked={isNoEatChecked}
                        onChange={(e) => setIsNoEatChecked(e.target.checked)}
                        className="h-6 w-6 rounded border-[3px] border-[#333]"
                      />
                      食べられない
                    </label>
                  </div>

                  <label className="block text-base font-bold text-[#2f2a27]">
                    具体的な内容 (注意事項等)
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={4}
                      className="mt-1 w-full rounded border-[3px] border-[#7f7f7f] bg-transparent p-2"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetForms();
                        setShowForm(false);
                      }}
                      className="h-12 rounded border-[3px] border-[#B79074] bg-[#FAF8F6] text-4xl font-bold text-[#B79074]"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      disabled={submitLoading}
                      className="h-12 rounded bg-[#B79074] text-4xl font-bold text-white disabled:opacity-70"
                    >
                      {submitLoading ? "送信中" : "登録"}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleMealSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <label className="text-base font-bold text-[#2f2a27]">
                      園児名
                      <input
                        type="text"
                        list="child-name-options"
                        value={mealChildName}
                        onChange={(e) => setMealChildName(e.target.value)}
                        className="mt-1 h-11 w-full rounded border-[3px] border-[#7f7f7f] bg-transparent px-2"
                      />
                    </label>
                    <label className="text-base font-bold text-[#2f2a27]">
                      月齢
                      <input
                        type="number"
                        min={0}
                        value={mealAgeMonth}
                        onChange={(e) => setMealAgeMonth(e.target.value)}
                        className="mt-1 h-11 w-full rounded border-[3px] border-[#7f7f7f] bg-transparent px-2"
                      />
                    </label>
                  </div>

                  <label className="block text-base font-bold text-[#2f2a27]">
                    食材名 (選択)
                    <input
                      type="text"
                      value={mealFood}
                      onChange={(e) => setMealFood(e.target.value)}
                      className="mt-1 h-11 w-full rounded border-[3px] border-[#7f7f7f] bg-transparent px-2"
                    />
                  </label>

                  <label className="block text-base font-bold text-[#2f2a27]">
                    具体的な内容 (注意事項等)
                    <textarea
                      value={mealDetail}
                      onChange={(e) => setMealDetail(e.target.value)}
                      rows={4}
                      className="mt-1 w-full rounded border-[3px] border-[#7f7f7f] bg-transparent p-2"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetForms();
                        setShowForm(false);
                      }}
                      className="h-12 rounded border-[3px] border-[#B79074] bg-[#FAF8F6] text-4xl font-bold text-[#B79074]"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      disabled={submitLoading}
                      className="h-12 rounded bg-[#B79074] text-4xl font-bold text-white disabled:opacity-70"
                    >
                      {submitLoading ? "送信中" : "登録"}
                    </button>
                  </div>
                </form>
              )}

              {formMsg && <p className="mt-3 text-sm text-[#6b5a4e]">{formMsg}</p>}
            </div>
          )}

          <section className="mt-5 space-y-3">
            {listLoading && <p className="text-sm text-[#6b5a4e]">読み込み中...</p>}

            {!listLoading && namesForTab.length === 0 && (
              <p className="rounded-md bg-[#F3F3F3] p-4 text-sm text-[#6b5a4e]">
                表示できるデータがありません。
              </p>
            )}

            {!listLoading &&
              namesForTab.map((name) =>
                activeTab === "child"
                  ? renderChildPanel(name)
                  : renderMealPanel(name, activeTab === "cook" ? "growth" : "hiyari")
              )}
          </section>
        </div>
      </div>

      <datalist id="child-name-options">
        {childOptions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </main>
  );
}


