"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Ribbon from "@/components/Ribbon";

export default function Page4() {
  const router = useRouter();
  const [childName, setChildName] = useState("");
  const [ageMonth, setAgeMonth] = useState("");
  const [noEat, setNoEat] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const loggedIn = localStorage.getItem("yochiLoggedIn") === "true";
    const storedMemberId = localStorage.getItem("yochiMemberId");
    if (!loggedIn || !storedMemberId) {
      router.replace("/login");
      return;
    }
    setMemberId(storedMemberId);
    setAuthChecked(true);
  }, [router]);

  if (!authChecked) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
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

      setMsg("登録しました！");
      setChildName("");
      setAgeMonth("");
      setNoEat("");
      setNote("");
    } catch {
      setMsg("保存に失敗しました");
    } finally {
      setLoading(false);
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
        {/* フォーム */}
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md bg-white rounded-2xl border border-[#E8DCD0] shadow-md p-6 space-y-4"
        >
          <h1 className="text-lg font-bold">食べられない食品の登録</h1>

          <label className="block">
            園児の名前
            <input
              type="text"
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

        {/* 下部ボタン */}
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
            登録内容を確認する
          </Link>
        </div>
      </div>
    </main>
  );
}
