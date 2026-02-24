"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Pencil, Search, X } from "lucide-react";
import { useMenuData } from "@/hooks/useMenuData";
import { canon } from "@/lib/textNormalize";
import Ribbon from "@/components/Ribbon";

type RegisterTab = "child" | "cook" | "hiyari";
type ChildFormMode = "register" | "edit";
type CookDrafts = {
  phase1: string;
  phase2: string;
  phase3: string;
  phase4: string;
  phase5: string;
};

type AnswerItem = {
  id: number;
  child_name: string;
  age_month: number;
  no_eat: string;
  can_eat: boolean | null;
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

type AccidentItem = {
  id: number;
  child_name: string;
  food_name: string;
  accident_content: string;
  public: boolean | null;
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
  const [isNoEatChecked, setIsNoEatChecked] = useState(false);
  const [childFormMode, setChildFormMode] = useState<ChildFormMode>("register");
  const [editingAnswerId, setEditingAnswerId] = useState<number | null>(null);
  const [foodEditTargetName, setFoodEditTargetName] = useState<string | null>(null);
  const [editingSourceName, setEditingSourceName] = useState<string | null>(null);

  const [accidentChildName, setAccidentChildName] = useState("");
  const [accidentFood, setAccidentFood] = useState("");
  const [accidentDetail, setAccidentDetail] = useState("");
  const [accidentPublic, setAccidentPublic] = useState(false);
  const [editingAccidentId, setEditingAccidentId] = useState<number | null>(null);
  const [cookFoodName, setCookFoodName] = useState("");
  const [cookDrafts, setCookDrafts] = useState<CookDrafts>({
    phase1: "",
    phase2: "",
    phase3: "",
    phase4: "",
    phase5: "",
  });

  const [formMsg, setFormMsg] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const [authChecked, setAuthChecked] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [expandedNames, setExpandedNames] = useState<Record<string, boolean>>({});

  const [answerItems, setAnswerItems] = useState<AnswerItem[]>([]);
  const [mealItems, setMealItems] = useState<MealItem[]>([]);
  const [accidentItems, setAccidentItems] = useState<AccidentItem[]>([]);
  const [listLoading, setListLoading] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  const { menuMap, foodIdMap, foodNameOptions } = useMenuData(memberId, reloadTick);

  const accidentFoodId = useMemo(() => {
    const key = canon(accidentFood);
    if (!key) return null;
    return foodIdMap[key] ?? null;
  }, [accidentFood, foodIdMap]);

  const noEatFoodId = useMemo(() => {
    const key = canon(noEat);
    if (!key) return null;
    return foodIdMap[key] ?? null;
  }, [noEat, foodIdMap]);

  const cookFoodOptions = useMemo(() => {
    return foodNameOptions;
  }, [foodNameOptions]);

  const primaryActionLabel =
    activeTab === "cook" ? "食材登録" : activeTab === "hiyari" ? "ヒヤリハット報告" : "園児追加";

  const handleTabChange = (tab: RegisterTab) => {
    setActiveTab(tab);
    setShowForm(false);
    setFormMsg(null);
  };

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
          fetch(`/api/enji-info?member_id=${encodeURIComponent(memberId)}`, {
            cache: "no-store",
          }),
          fetch(`/api/meal-records?member_id=${encodeURIComponent(memberId)}&limit=200`, {
            cache: "no-store",
          }),
        ]);
        if (!answersRes.ok || !mealsRes.ok) throw new Error("fetch failed");

        const answersJson = await answersRes.json();
        const mealsJson = await mealsRes.json();
        let nextAccidents: AccidentItem[] = [];
        try {
          const accidentsRes = await fetch(
            `/api/accidents?member_id=${encodeURIComponent(memberId)}&limit=200`,
            { cache: "no-store" }
          );
          if (accidentsRes.ok) {
            const accidentsJson = await accidentsRes.json();
            nextAccidents = (Array.isArray(accidentsJson)
              ? accidentsJson
              : accidentsJson.items ?? []) as AccidentItem[];
          }
        } catch {
          nextAccidents = [];
        }

        if (cancelled) return;

        const nextAnswers = (Array.isArray(answersJson) ? answersJson : answersJson.items ?? []) as AnswerItem[];
        const nextMeals = (Array.isArray(mealsJson) ? mealsJson : mealsJson.items ?? []) as MealItem[];

        setAnswerItems(nextAnswers);
        setMealItems(nextMeals);
        setAccidentItems(nextAccidents);
      } catch {
        if (!cancelled) {
          setAnswerItems([]);
          setMealItems([]);
          setAccidentItems([]);
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
      ...accidentItems.map((item) => item.child_name),
    ]
      .map((name) => name.trim())
      .filter(Boolean);
    return Array.from(new Set(names));
  }, [answerItems, mealItems, accidentItems]);

  const namesForTab = useMemo(() => {
    if (activeTab === "cook") {
      return cookFoodOptions.filter((name) =>
        name.toLowerCase().includes(searchText.trim().toLowerCase())
      );
    }
    if (activeTab === "hiyari") {
      return [];
    }

    const latestMap = new Map<string, number>();

    const addLatest = (name: string, createdAt: string) => {
      const t = new Date(createdAt).getTime();
      const prev = latestMap.get(name) ?? 0;
      if (t > prev) latestMap.set(name, t);
    };

    if (activeTab === "child") {
      for (const item of answerItems) addLatest(item.child_name, item.created_at);
      for (const item of accidentItems) {
        addLatest(item.child_name, item.created_at);
      }
    }

    return Array.from(latestMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)
      .filter((name) => name.toLowerCase().includes(searchText.trim().toLowerCase()));
  }, [activeTab, answerItems, mealItems, accidentItems, searchText, cookFoodOptions]);

  const filteredAccidents = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return accidentItems.filter((item) =>
      q ? item.food_name.toLowerCase().includes(q) : true
    );
  }, [accidentItems, searchText]);

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

  useEffect(() => {
    setSearchText("");
  }, [activeTab]);

  if (!authChecked) return null;

  const toggleExpanded = (name: string) => {
    setExpandedNames((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const resetForms = () => {
    setChildName("");
    setAgeMonth("");
    setNoEat("");
    setNote("");
    setEditingAnswerId(null);
    setChildFormMode("register");
    setAccidentChildName("");
    setAccidentFood("");
    setAccidentDetail("");
    setAccidentPublic(false);
    setEditingAccidentId(null);
    setCookFoodName("");
    setCookDrafts({
      phase1: "",
      phase2: "",
      phase3: "",
      phase4: "",
      phase5: "",
    });
    setIsNoEatChecked(false);
    setFormMsg(null);
  };

  const loadCookDraftFromName = (name: string) => {
    const key = canon(name);
    const info = key ? menuMap[key] : undefined;
    setCookFoodName(name);
    setCookDrafts({
      phase1: info?.phase1 ?? "",
      phase2: info?.phase2 ?? "",
      phase3: info?.phase3 ?? "",
      phase4: info?.phase4 ?? "",
      phase5: info?.phase5 ?? "",
    });
  };

  const openCookEditor = (foodName: string) => {
    loadCookDraftFromName(foodName);
    setShowForm(true);
    setFormMsg(null);
  };

  const openEditorForName = (name: string) => {
    const answer =
      answerItems.find((item) => item.child_name === name && item.no_eat.trim().length > 0) ??
      answerItems.find((item) => item.child_name === name);
    const meal = mealItems.find((item) => item.child_name === name);
    const month = answer?.age_month ?? meal?.age_month ?? "";

    if (activeTab === "child") {
      setChildFormMode("edit");
      setEditingAnswerId(null);
      setFoodEditTargetName(name);
      setEditingSourceName(name);
      setExpandedNames((prev) => ({ ...prev, [name]: true }));
      setChildName(name);
      setAgeMonth(month ? String(month) : "");
      setNoEat("");
      setIsNoEatChecked(false);
      setNote("");
      setShowForm(false);
    } else {
      const target =
        accidentItems.find((item) => item.child_name === name) ??
        accidentItems.find((item) => item.food_name === name);
      if (target) {
        setEditingAccidentId(target.id);
        setAccidentChildName(target.child_name);
        setAccidentFood(target.food_name);
        setAccidentDetail(target.accident_content);
        setAccidentPublic(target.public === true);
        setShowForm(true);
      }
    }

    setFormMsg(null);
  };

  const handleDeleteFood = async (item: AnswerItem) => {
    if (!memberId) return;
    if (!window.confirm("この食材を削除しますか？")) return;

    setFormMsg(null);
    setSubmitLoading(true);
    try {
      const res = await fetch("/api/enji-info", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, member_id: memberId }),
      });
      if (!res.ok) throw new Error("delete failed");
      setFormMsg("削除しました。");
      setReloadTick((prev) => prev + 1);
    } catch {
      setFormMsg("削除に失敗しました。");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteChildPanel = async (name: string) => {
    if (!memberId) return;
    if (!window.confirm(`${name}の食材情報を削除しますか？`)) return;

    setFormMsg(null);
    setSubmitLoading(true);
    try {
      const res = await fetch("/api/enji-info", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: memberId,
          child_name: name,
          delete_child: true,
        }),
      });
      if (!res.ok) throw new Error("delete failed");

      if (foodEditTargetName === name) {
        closeInlineEditor();
      }
      setFormMsg("削除しました。");
      setReloadTick((prev) => prev + 1);
    } catch {
      setFormMsg("削除に失敗しました。");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleStartEditFood = (item: AnswerItem) => {
    setChildFormMode("edit");
    setEditingAnswerId(item.id);
    setFoodEditTargetName(item.child_name);
    setEditingSourceName(item.child_name);
    setChildName(item.child_name);
    setAgeMonth(String(item.age_month));
    setNoEat(item.no_eat);
    setIsNoEatChecked(item.can_eat !== true);
    setNote(item.note ?? "");
    setFormMsg(null);
  };

  const handleChildSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    if (!childName || !ageMonth || !memberId) {
      setFormMsg("すべての必須項目を入力してください。");
      return;
    }

    setSubmitLoading(true);
    try {
      const body = {
        child_name: childName,
        age_month: Number(ageMonth),
        no_eat: "",
        can_eat: true,
        note: "",
        member_id: memberId,
        mode: "child",
      };

      const res = await fetch("/api/enji-info", {
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

  const handleInlineFoodSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    if (!childName || !ageMonth || !memberId) {
      setFormMsg("すべての必須項目を入力してください。");
      return;
    }

    setSubmitLoading(true);
    try {
      if (!editingAnswerId && !noEat.trim()) {
        const sourceName = editingSourceName ?? childName;
        const targets = answerItems.filter((item) => item.child_name === sourceName);

        if (targets.length === 0) {
          throw new Error("no rows to update");
        }

        const requests = targets.map((item) =>
          fetch("/api/enji-info", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: item.id,
              child_name: childName,
              age_month: Number(ageMonth),
              no_eat: item.no_eat,
              can_eat: item.can_eat === true,
              note: item.note ?? "",
              member_id: memberId,
            }),
          })
        );

        const responses = await Promise.all(requests);
        if (responses.some((res) => !res.ok)) throw new Error("bulk update failed");

        setFormMsg("園児情報を更新しました。");
        setEditingSourceName(childName);
        setFoodEditTargetName(childName);
        setReloadTick((prev) => prev + 1);
        return;
      }

      if (!noEat.trim()) {
        setFormMsg("食材名を入力してください。");
        return;
      }
      if (noEatFoodId == null) {
        setFormMsg("登録されている食材を選択してください。");
        return;
      }

      const body = {
        child_name: childName,
        age_month: Number(ageMonth),
        no_eat: noEat,
        can_eat: !isNoEatChecked,
        food_id: noEatFoodId,
        note,
        member_id: memberId,
      };

      const res = await fetch("/api/enji-info", {
        method: childFormMode === "edit" && editingAnswerId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          childFormMode === "edit" && editingAnswerId ? { id: editingAnswerId, ...body } : body
        ),
      });

      if (!res.ok) throw new Error("save failed");

      setFormMsg(editingAnswerId ? "更新しました。" : "追加しました。");
      setReloadTick((prev) => prev + 1);
      setEditingAnswerId(null);
      setNoEat("");
      setNote("");
      setIsNoEatChecked(false);
    } catch {
      setFormMsg("保存に失敗しました。");
    } finally {
      setSubmitLoading(false);
    }
  };

  const closeInlineEditor = () => {
    setFoodEditTargetName(null);
    setEditingAnswerId(null);
    setEditingSourceName(null);
    setNoEat("");
    setNote("");
    setIsNoEatChecked(false);
    setFormMsg(null);
  };

  const handleAccidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    if (!accidentChildName || !accidentFood || !accidentDetail || !memberId) {
      setFormMsg("すべての必須項目を入力してください。");
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await fetch("/api/accidents", {
        method: editingAccidentId != null ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingAccidentId,
          child_name: accidentChildName,
          food_name: accidentFood,
          accident_content: accidentDetail,
          public: accidentPublic,
          food_id: accidentFoodId,
          member_id: memberId,
        }),
      });

      if (!res.ok) throw new Error("save failed");

      setFormMsg(editingAccidentId != null ? "更新しました。" : "登録しました。");
      setReloadTick((prev) => prev + 1);
      resetForms();
      setShowForm(false);
    } catch {
      setFormMsg("登録に失敗しました。");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleCookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormMsg(null);

    if (!cookFoodName.trim()) {
      setFormMsg("食材名を入力してください。");
      return;
    }
    if (!memberId) {
      setFormMsg("ログイン情報を確認してください。");
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await fetch("/api/a-cook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: memberId,
          food_name: cookFoodName.trim(),
          ...cookDrafts,
        }),
      });
      if (!res.ok) throw new Error("save failed");

      setFormMsg("登録しました。");
      setReloadTick((prev) => prev + 1);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("yochi-cook-updated"));
      }
      setShowForm(false);
      resetForms();
    } catch {
      setFormMsg("登録に失敗しました。");
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderChildPanel = (name: string) => {
    const noEatItems = answerItems.filter(
      (item) => item.child_name === name && item.no_eat.trim().length > 0
    );
    const hiyariItems = accidentItems.filter((item) => item.child_name === name);
    const month =
      noEatItems[0]?.age_month ??
      answerItems.find((item) => item.child_name === name)?.age_month ??
      "-";

    return (
      <div key={name} className="flex items-start gap-2">
        {activeTab === "child" && showForm && (
          <button
            type="button"
            onClick={() => handleDeleteChildPanel(name)}
            className="mt-3 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[2px] border-[#d64a3a] bg-white text-[#d64a3a]"
            aria-label={`${name}の食材情報を削除`}
          >
            <X size={14} strokeWidth={2.5} />
          </button>
        )}
        <div className="w-full rounded-md border border-[#E6D7C8] bg-white p-4">
          <div
            role="button"
            tabIndex={0}
            onClick={() => toggleExpanded(name)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleExpanded(name);
              }
            }}
            className="flex cursor-pointer items-center justify-between"
          >
            <div className="text-left text-lg font-bold text-[#5C3A2E]">{name}</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(name);
                }}
                className="rounded p-1 text-[#2f2a27]"
                aria-label={`${name}を${expandedNames[name] ? "収納" : "展開"}`}
              >
                {expandedNames[name] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openEditorForName(name);
                }}
                className="rounded p-1 text-[#2f2a27] hover:bg-[#e7ddd3]"
                aria-label={`${name}を編集`}
              >
                <Pencil size={18} />
              </button>
            </div>
          </div>

          {expandedNames[name] && (
            <div className="mt-4 space-y-5">
            <div className="flex items-center justify-between text-[#2f2a27]">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold">注意する食材</h3>
              </div>
              <span className="text-lg font-semibold">月齢 : {month}</span>
            </div>

            {noEatItems.length > 0 ? (
              <div className="space-y-2">
                {noEatItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    {foodEditTargetName === name && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDeleteFood(item)}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[2px] border-[#d64a3a] bg-white text-[#d64a3a]"
                          aria-label={`${item.no_eat}を削除`}
                        >
                          <X size={14} strokeWidth={2.5} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEditFood(item)}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-[2px] border-[#2f2a27] bg-white text-[#2f2a27]"
                          aria-label={`${item.no_eat}を編集`}
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                    )}
                    <div className={`w-full rounded-md p-3 ${item.can_eat ? "bg-[#FFF2D2]" : "bg-[#f3e9e9]"}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-[#2f2a27]">{item.no_eat}</p>
                          {item.note && <p className="text-sm text-[#2f2a27]">{item.note}</p>}
                        </div>
                        {!item.can_eat && (
                          <p className="text-sm font-medium text-[#dd3019]">食べられない</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#6b5a4e]">未登録です。</p>
            )}

            {foodEditTargetName === name && (
              <form onSubmit={handleInlineFoodSubmit} className="space-y-4 rounded-md bg-white p-4">
                <div className="grid grid-cols-2 gap-4">
                  <label className="text-base font-medium text-[#2f2a27]">
                    園児名
                    <input
                      type="text"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      className="mt-1 h-11 w-full rounded border-[3px] border-[#7f7f7f] bg-transparent px-2"
                    />
                  </label>
                  <label className="text-base font-medium text-[#2f2a27]">
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

                <div className="grid grid-cols-2 items-end gap-4">
                  <label className="text-base font-medium text-[#2f2a27]">
                    食材名 (選択)
                    <input
                      type="text"
                      list="a-cook-food-options"
                      value={noEat}
                      onChange={(e) => setNoEat(e.target.value)}
                      className="mt-1 h-11 w-full rounded border-[3px] border-[#7f7f7f] bg-transparent px-2"
                    />
                  </label>
                  <label className="inline-flex h-11 items-center justify-center gap-2 text-lg font-medium text-[#2f2a27]">
                    <input
                      type="checkbox"
                      checked={isNoEatChecked}
                      onChange={(e) => setIsNoEatChecked(e.target.checked)}
                      className="h-6 w-6 rounded border-[3px] border-[#333]"
                    />
                    食べられない
                  </label>
                </div>

                <label className="block text-base font-medium text-[#2f2a27]">
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
                    onClick={closeInlineEditor}
                    className="h-12 rounded border-[3px] border-[#B79074] bg-[#FFFDF8] text-base font-bold text-[#B79074]"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="h-12 rounded bg-[#B79074] text-base font-bold text-white disabled:opacity-70"
                  >
                    {submitLoading ? "送信中" : editingAnswerId ? "更新" : "保存"}
                  </button>
                </div>
                {formMsg && <p className="text-sm text-[#6b5a4e]">{formMsg}</p>}
              </form>
            )}

            {hiyariItems.length > 0 && (
              <div>
                <h3 className="mb-2 text-base font-bold text-[#2f2a27]">ヒヤリハット</h3>
                <div className="space-y-2">
                  {hiyariItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="rounded-md border border-[#E6D7C8] bg-[#F9F4E8] p-3">
                      <p className="text-base font-bold text-[#2f2a27]">{item.food_name}</p>
                      {item.accident_content && <p className="text-sm text-[#2f2a27]">{item.accident_content}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMealPanel = (name: string, type: "growth" | "hiyari") => {
    const items = mealItems.filter(
      (item) => item.child_name === name && item.record_type === type
    );
    const month = items[0]?.age_month ?? "-";

    return (
      <div key={name} className="rounded-md border border-[#E6D7C8] bg-white p-4">
        <div
          role="button"
          tabIndex={0}
          onClick={() => toggleExpanded(name)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleExpanded(name);
            }
          }}
          className="flex cursor-pointer items-center justify-between"
        >
          <div className="text-left text-lg font-bold text-[#5C3A2E]">{name}</div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(name);
              }}
              className="rounded p-1 text-[#2f2a27]"
              aria-label={`${name}を${expandedNames[name] ? "収納" : "展開"}`}
            >
              {expandedNames[name] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openEditorForName(name);
              }}
              className="rounded p-1 text-[#2f2a27] hover:bg-[#e7ddd3]"
              aria-label={`${name}を編集`}
            >
              <Pencil size={18} />
            </button>
          </div>
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
                  className={`rounded-md border border-[#E6D7C8] p-3 ${
                    type === "growth" ? "bg-[#eef1da]" : "bg-[#F9F4E8]"
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

  const renderCookPanel = (foodName: string) => {
    const key = canon(foodName);
    const info = key ? menuMap[key] : undefined;
    const phases: Array<{ label: string; value?: string }> = [
      { label: "離乳初期", value: info?.phase1 },
      { label: "離乳中期", value: info?.phase2 },
      { label: "離乳後期", value: info?.phase3 },
      { label: "完了期", value: info?.phase4 },
      { label: "幼児期", value: info?.phase5 },
    ];

    return (
      <div key={foodName} className="rounded-md border border-[#E6D7C8] bg-white p-4">
        <div
          role="button"
          tabIndex={0}
          onClick={() => toggleExpanded(foodName)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              toggleExpanded(foodName);
            }
          }}
            className="flex cursor-pointer items-center justify-between"
          >
            <div className="text-left text-lg font-bold text-[#5C3A2E]">{foodName}</div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openCookEditor(foodName);
                }}
                className="rounded p-1 text-[#2f2a27] hover:bg-[#e7ddd3]"
                aria-label={`${foodName}を編集`}
              >
                <Pencil size={18} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(foodName);
                }}
                className="rounded p-1 text-[#2f2a27]"
                aria-label={`${foodName}を${expandedNames[foodName] ? "収納" : "展開"}`}
              >
                {expandedNames[foodName] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            </div>
          </div>

        {expandedNames[foodName] && (
          <div className="mt-4 space-y-3">
            {phases.map((phase) => (
              <div key={phase.label} className="grid grid-cols-[5.6rem_1fr] items-center gap-2">
                <div className="text-base font-bold text-[#2f2a27]">{phase.label}</div>
                <div className="rounded border-[3px] border-[#7f7f7f] bg-[#fafafa] px-3 py-2 text-base text-[#2f2a27]">
                  {phase.value?.trim() ? phase.value : "未登録"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#FFFDF8] text-[#2f2a27]">
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
              onClick={() => handleTabChange("child")}
              className={`rounded-t-md py-2 text-base font-bold ${
                activeTab === "child" ? "bg-[#B79074] text-white" : "bg-[#ece4dc] text-[#7d7570]"
              }`}
            >
              園児情報
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("cook")}
              className={`rounded-t-md py-2 text-base font-bold ${
                activeTab === "cook" ? "bg-[#B79074] text-white" : "bg-[#ece4dc] text-[#7d7570]"
              }`}
            >
              調理方法
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("hiyari")}
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
              placeholder={
                activeTab === "cook" || activeTab === "hiyari"
                  ? "食材名を入力してください"
                  : "園児名を入力してください"
              }
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="h-12 w-full rounded-sm border-[3px] border-[#b79074] bg-[#FFFDF8] px-3 text-base outline-none placeholder:text-[#b7aea6]"
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
              resetForms();
              setChildFormMode("register");
              setFoodEditTargetName(null);
              setEditingAccidentId(null);
              if (activeTab === "cook") {
                const q = searchText.trim();
                if (q) {
                  loadCookDraftFromName(q);
                }
              } else if (activeTab === "hiyari") {
                const q = searchText.trim();
                if (q) {
                  setAccidentFood(q);
                }
              }
              setShowForm((prev) => !prev);
              setFormMsg(null);
            }}
            className="mt-6 w-full rounded-sm bg-[#B79074] py-2 text-base font-bold text-white"
          >
            {primaryActionLabel}
          </button>

          {showForm && (
            <div className="rounded-b-md border-x-[3px] border-b-[3px] border-[#b79074] bg-white p-4">
              {activeTab === "child" ? (
                <form onSubmit={handleChildSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <label className="text-base font-medium text-[#2f2a27]">
                      園児名
                      <input
                        type="text"
                        list="child-name-options"
                        value={childName}
                        onChange={(e) => setChildName(e.target.value)}
                        className="mt-1 h-11 w-full rounded border-[3px] border-[#7f7f7f] bg-transparent px-2"
                      />
                    </label>
                    <label className="text-base font-medium text-[#2f2a27]">
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

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetForms();
                        setShowForm(false);
                      }}
                      className="h-12 rounded border-[3px] border-[#B79074] bg-[#FFFDF8] text-base font-bold text-[#B79074]"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      disabled={submitLoading}
                      className="h-12 rounded bg-[#B79074] text-base font-bold text-white disabled:opacity-70"
                    >
                      {submitLoading ? "送信中" : "登録"}
                    </button>
                  </div>
                </form>
              ) : activeTab === "cook" ? (
                <form onSubmit={handleCookSubmit} className="space-y-4">
                  <label className="block text-base font-medium text-[#2f2a27]">
                    食材名
                    <input
                      type="text"
                      list="a-cook-food-options"
                      value={cookFoodName}
                      onChange={(e) => setCookFoodName(e.target.value)}
                      className="mt-1 h-11 w-full rounded border-[3px] border-[#7f7f7f] bg-transparent px-2"
                    />
                  </label>

                  <div className="space-y-2">
                    <p className="text-base font-medium text-[#2f2a27]">調理方法</p>
                    {[
                      { key: "phase1", label: "離乳初期" },
                      { key: "phase2", label: "離乳中期" },
                      { key: "phase3", label: "離乳後期" },
                      { key: "phase4", label: "完了期" },
                      { key: "phase5", label: "幼児期" },
                    ].map((row) => (
                      <div
                        key={row.key}
                        className="grid grid-cols-[5.6rem_1fr] items-center gap-2"
                      >
                        <div className="text-base font-medium text-[#2f2a27]">{row.label}</div>
                        <input
                          type="text"
                          value={cookDrafts[row.key as keyof CookDrafts]}
                          onChange={(e) =>
                            setCookDrafts((prev) => ({
                              ...prev,
                              [row.key]: e.target.value,
                            }))
                          }
                          className="h-11 w-full rounded border-[3px] border-[#7f7f7f] bg-transparent px-2"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetForms();
                        setShowForm(false);
                      }}
                      className="h-12 rounded border-[3px] border-[#B79074] bg-[#FFFDF8] text-base font-bold text-[#B79074]"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      disabled={submitLoading}
                      className="h-12 rounded bg-[#B79074] text-base font-bold text-white disabled:opacity-70"
                    >
                      {submitLoading ? "送信中" : "登録"}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleAccidentSubmit} className="space-y-4">
                  <label className="block text-base font-medium text-[#2f2a27]">
                    園児名
                    <input
                      type="text"
                      list="child-name-options"
                      value={accidentChildName}
                      onChange={(e) => setAccidentChildName(e.target.value)}
                      className="mt-1 h-11 w-full rounded border-[3px] border-[#7f7f7f] bg-transparent px-2"
                    />
                  </label>

                  <label className="block text-base font-medium text-[#2f2a27]">
                    食材名 (選択)
                    <input
                      type="text"
                      list="a-cook-food-options"
                      value={accidentFood}
                      onChange={(e) => setAccidentFood(e.target.value)}
                      className="mt-1 h-11 w-full rounded border-[3px] border-[#7f7f7f] bg-transparent px-2"
                    />
                  </label>

                  <label className="block text-base font-medium text-[#2f2a27]">
                    ヒヤリハット内容
                    <textarea
                      value={accidentDetail}
                      onChange={(e) => setAccidentDetail(e.target.value)}
                      rows={4}
                      className="mt-1 w-full rounded border-[3px] border-[#7f7f7f] bg-transparent p-2"
                    />
                  </label>

                  <label className="inline-flex items-center gap-2 text-sm text-[#2f2a27]">
                    <input
                      type="checkbox"
                      checked={accidentPublic}
                      onChange={(e) => setAccidentPublic(e.target.checked)}
                      className="h-4 w-4"
                    />
                    公開する
                  </label>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetForms();
                        setShowForm(false);
                      }}
                      className="h-12 rounded border-[3px] border-[#B79074] bg-[#FFFDF8] text-base font-bold text-[#B79074]"
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      disabled={submitLoading}
                      className="h-12 rounded bg-[#B79074] text-base font-bold text-white disabled:opacity-70"
                    >
                      {submitLoading ? "送信中" : editingAccidentId != null ? "更新" : "登録"}
                    </button>
                  </div>
                </form>
              )}

              {formMsg && <p className="mt-3 text-sm text-[#6b5a4e]">{formMsg}</p>}
            </div>
          )}

          <section className="mt-5 space-y-3">
            {listLoading && <p className="text-sm text-[#6b5a4e]">読み込み中...</p>}

            {!listLoading &&
              (activeTab === "hiyari" ? filteredAccidents.length === 0 : namesForTab.length === 0) && (
              <p className="rounded-md bg-[#F3F3F3] p-4 text-sm text-[#6b5a4e]">
                表示できるデータがありません。
              </p>
            )}

            {!listLoading && activeTab !== "hiyari" &&
              namesForTab.map((name) =>
                activeTab === "child"
                  ? renderChildPanel(name)
                  : activeTab === "cook"
                    ? renderCookPanel(name)
                    : renderMealPanel(name, "hiyari")
              )}

            {!listLoading && activeTab === "hiyari" && (
              <div className="space-y-3">
                {filteredAccidents.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-md p-4 ${
                      item.public ? "bg-[#F2E5C8]" : "bg-[#F7F7F7]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-bold text-[#2f2a27]">{item.food_name}</p>
                        <p className="mt-1 text-sm text-[#2f2a27]">{item.accident_content}</p>
                        <p className="mt-1 text-xs text-[#6b5a4e]">
                          {item.child_name} / {formatDateTime(item.created_at)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingAccidentId(item.id);
                          setAccidentChildName(item.child_name);
                          setAccidentFood(item.food_name);
                          setAccidentDetail(item.accident_content);
                          setAccidentPublic(item.public === true);
                          setShowForm(true);
                          setFormMsg(null);
                        }}
                        className="rounded p-1 text-[#2f2a27] hover:bg-[#e7ddd3]"
                        aria-label={`${item.food_name}のヒヤリハットを編集`}
                      >
                        <Pencil size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      <datalist id="child-name-options">
        {childOptions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      <datalist id="a-cook-food-options">
        {cookFoodOptions.map((foodName) => (
          <option key={foodName} value={foodName} />
        ))}
      </datalist>
    </main>
  );
}








