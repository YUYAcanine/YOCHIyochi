"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Ribbon from "@/components/Ribbon";
import { useMenuData } from "@/hooks/useMenuData";
import { canon } from "@/lib/textNormalize";

type TabKey = "no-eat" | "meal";

export default function Page4() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("no-eat");

  const [childName, setChildName] = useState("");
  const [ageMonth, setAgeMonth] = useState("");
  const [noEat, setNoEat] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [mealChildName, setMealChildName] = useState("");
  const [mealAgeMonth, setMealAgeMonth] = useState("");
  const [mealType, setMealType] = useState<"growth" | "hiyari">("growth");
  const [mealFood, setMealFood] = useState("");
  const [mealDetail, setMealDetail] = useState("");
  const [mealMsg, setMealMsg] = useState<string | null>(null);
  const [mealLoading, setMealLoading] = useState(false);

  const [authChecked, setAuthChecked] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [childOptions, setChildOptions] = useState<string[]>([]);

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
    if (!memberId) {
      setChildOptions([]);
      return;
    }
    let cancelled = false;
    const fetchChildren = async () => {
      try {
        const res = await fetch(
          `/api/answers?member_id=${encodeURIComponent(memberId)}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error("fetch failed");
        const json = await res.json();
        const items: Array<{ child_name?: string | null }> = Array.isArray(json)
          ? json
          : json.items ?? [];
        if (cancelled) return;
        const names = items
          .map((item) => (item.child_name ?? "").trim())
          .filter(Boolean);
        const unique = Array.from(new Set(names));
        setChildOptions(unique);
      } catch {
        if (!cancelled) setChildOptions([]);
      }
    };

    fetchChildren();
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  if (!authChecked) {
    return null;
  }

  const handleNoEatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!childName || !ageMonth || !noEat || !memberId) {
      setMsg("すべての項目を入力してください。");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_name: childName,
          age_month: Number(ageMonth),
          no_eat: noEat,
          note,
          member_id: memberId,
        }),
      });

      if (!res.ok) throw new Error("保存に失敗しました");

      setMsg("登録しました。");
      setChildName("");
      setAgeMonth("");
      setNoEat("");
      setNote("");
    } catch {
      setMsg("保存に失敗しました。");
    } finally {
      setLoading(false);
    }
  };

  const handleMealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMealMsg(null);

    if (!mealChildName || !mealAgeMonth || !mealFood || !mealDetail || !memberId) {
      setMealMsg("すべての項目を入力してください。");
      return;
    }

    setMealLoading(true);
    try {
      const res = await fetch("/api/meal-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          child_name: mealChildName,
          age_month: Number(mealAgeMonth),
          record_type: mealType,
          food_name: mealFood,
          detail: mealDetail,
          food_id: mealFoodId,
          member_id: memberId,
        }),
      });

      if (!res.ok) throw new Error("保存に失敗しました");

      setMealMsg("登録しました。");
      setMealChildName("");
      setMealAgeMonth("");
      setMealFood("");
      setMealDetail("");
      setMealType("growth");
    } catch {
      setMealMsg("保存に失敗しました。");
    } finally {
      setMealLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF8F6] text-[#4D3F36] relative">
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

      <div className="pt-24 px-6 pb-10 flex flex-col items-center">
        <div className="w-full max-w-2xl mb-6">
          <h1 className="text-xl font-bold text-[#4D3F36]">給食記録</h1>
          <div className="mt-4 flex gap-2 w-full">
            <button
              type="button"
              onClick={() => setActiveTab("no-eat")}
              className={`flex-1 px-4 py-2 rounded-xl font-semibold border transition ${
                activeTab === "no-eat"
                  ? "bg-[#9C7B6C] text-white border-[#9C7B6C]"
                  : "bg-white text-[#6B5A4E] border-[#D6C2B4] hover:bg-[#F5EDE6]"
              }`}
            >
              食べられない食品登録
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("meal")}
              className={`flex-1 px-4 py-2 rounded-xl font-semibold border transition ${
                activeTab === "meal"
                  ? "bg-[#9C7B6C] text-white border-[#9C7B6C]"
                  : "bg-white text-[#6B5A4E] border-[#D6C2B4] hover:bg-[#F5EDE6]"
              }`}
            >
              園児の食事記録
            </button>
          </div>
        </div>

        {activeTab === "no-eat" && (
          <form
            onSubmit={handleNoEatSubmit}
            className="w-full max-w-md bg-white rounded-2xl border border-[#E8DCD0] shadow-md p-6 space-y-4"
          >
            <h2 className="text-lg font-bold">食べられない食品の登録</h2>

            <label className="block">
              園児の名前
              <input
                type="text"
                list="child-name-options"
                className="mt-1 block w-full rounded-lg border border-[#D3C5B9] bg-[#FFF9F5] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#C7A690]"
                value={childName}
                onChange={(e) => setChildName(e.target.value)}
                placeholder="例：山田 太郎"
              />
            </label>

            <label className="block">
              園児の月齢
              <input
                type="number"
                min={0}
                className="mt-1 block w-full rounded-lg border border-[#D3C5B9] bg-[#FFF9F5] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#C7A690]"
                value={ageMonth}
                onChange={(e) => setAgeMonth(e.target.value)}
                placeholder="例：18"
              />
            </label>

            <label className="block">
              食べられない食品
              <input
                type="text"
                className="mt-1 block w-full rounded-lg border border-[#D3C5B9] bg-[#FFF9F5] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#C7A690]"
                value={noEat}
                onChange={(e) => setNoEat(e.target.value)}
                placeholder="例：卵、牛乳"
              />
            </label>

            <label className="block">
              備考（食べられない理由など）
              <textarea
                className="mt-1 block w-full rounded-lg border border-[#D3C5B9] bg-[#FFF9F5] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#C7A690]"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="例：アレルギーのため"
                rows={3}
              />
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#9C7B6C] text-white py-3 rounded-xl font-semibold hover:bg-[#A88877] disabled:opacity-60"
            >
              {loading ? "送信中..." : "登録する"}
            </button>

            {msg && <p className="text-sm mt-2 text-[#6B5A4E]">{msg}</p>}
          </form>
        )}

        {activeTab === "meal" && (
          <form
            onSubmit={handleMealSubmit}
            className="w-full max-w-md bg-white rounded-2xl border border-[#E8DCD0] shadow-md p-6 space-y-4"
          >
            <h2 className="text-lg font-bold">園児の食事記録</h2>

            <label className="block">
              園児の名前
              <input
                type="text"
                list="child-name-options"
                className="mt-1 block w-full rounded-lg border border-[#D3C5B9] bg-[#FFF9F5] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#C7A690]"
                value={mealChildName}
                onChange={(e) => setMealChildName(e.target.value)}
                placeholder="例：山田 太郎"
              />
            </label>

            <label className="block">
              園児の月齢
              <input
                type="number"
                min={0}
                className="mt-1 block w-full rounded-lg border border-[#D3C5B9] bg-[#FFF9F5] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#C7A690]"
                value={mealAgeMonth}
                onChange={(e) => setMealAgeMonth(e.target.value)}
                placeholder="例：18"
              />
            </label>

            <label className="block">
              記録の種類
              <select
                className="mt-1 block w-full rounded-lg border border-[#D3C5B9] bg-[#FFF9F5] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#C7A690]"
                value={mealType}
                onChange={(e) => setMealType(e.target.value as "growth" | "hiyari")}
              >
                <option value="growth">成長キャッチ</option>
                <option value="hiyari">ヒヤリハット</option>
              </select>
            </label>

            <label className="block">
              該当した食べ物
              <input
                type="text"
                className="mt-1 block w-full rounded-lg border border-[#D3C5B9] bg-[#FFF9F5] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#C7A690]"
                value={mealFood}
                onChange={(e) => setMealFood(e.target.value)}
                placeholder="例：ぶどう"
              />
            </label>

            <label className="block">
              具体的な内容
              <textarea
                className="mt-1 block w-full rounded-lg border border-[#D3C5B9] bg-[#FFF9F5] px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#C7A690]"
                value={mealDetail}
                onChange={(e) => setMealDetail(e.target.value)}
                placeholder="例：皮が口に残って咳き込んだため、半分に切って提供"
                rows={4}
              />
            </label>

            <button
              type="submit"
              disabled={mealLoading}
              className="w-full bg-[#9C7B6C] text-white py-3 rounded-xl font-semibold hover:bg-[#A88877] disabled:opacity-60"
            >
              {mealLoading ? "送信中..." : "記録する"}
            </button>

            {mealMsg && <p className="text-sm mt-2 text-[#6B5A4E]">{mealMsg}</p>}
          </form>
        )}

        <div className="flex flex-wrap gap-3 mt-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-[#D6C2B4] bg-[#F5EDE6] px-5 py-2 font-semibold text-[#6B5A4E] shadow-sm transition hover:bg-[#E7DBCF]"
          >
            ホームに戻る
          </Link>
          <Link
            href="/Table"
            className="inline-flex items-center justify-center rounded-xl bg-[#9C7B6C] px-5 py-2 font-semibold text-white shadow-sm transition hover:bg-[#A88877]"
          >
            園児情報の確認
          </Link>
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

