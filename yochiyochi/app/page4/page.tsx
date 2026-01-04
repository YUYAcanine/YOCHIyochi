"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/Button";

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
    } catch (err) {
      setMsg("保存に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-between p-6">
      {/* フォーム */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-lg shadow p-6 space-y-4"
      >
        <h1 className="text-lg font-bold">食べられない食品の登録</h1>

        <label className="block">
          園児の名前
          <input
            type="text"
            className="mt-1 block w-full border rounded px-3 py-2"
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
            className="mt-1 block w-full border rounded px-3 py-2"
            value={ageMonth}
            onChange={(e) => setAgeMonth(e.target.value)}
            placeholder="例：18"
          />
        </label>

        <label className="block">
          食べられない食品
          <input
            type="text"
            className="mt-1 block w-full border rounded px-3 py-2"
            value={noEat}
            onChange={(e) => setNoEat(e.target.value)}
            placeholder="例：卵、牛乳"
          />
        </label>

        <label className="block">
          備考（食べられない理由など）
          <textarea
            className="mt-1 block w-full border rounded px-3 py-2"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="例：アレルギーのため"
            rows={3}
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-500 disabled:opacity-60"
        >
          {loading ? "送信中..." : "登録する"}
        </button>

        {msg && <p className="text-sm mt-2">{msg}</p>}
      </form>

      {/* 下部ボタン */}
      <div className="flex gap-4 mt-6 mb-4">
        <Button href="/" variant="gray">ホームに戻る</Button>
        <Button href="/page5" variant="purple">登録内容を確認する</Button>
      </div>
    </main>
  );
}
