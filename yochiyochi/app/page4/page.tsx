"use client";

import { useState } from "react";
import Button from "@/components/Button";

export default function Page4() {
  const [childName, setChildName] = useState("");
  const [ageMonth, setAgeMonth] = useState("");
  const [noEat, setNoEat] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    if (!childName || !ageMonth || !noEat) {
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
        }),
      });

      if (!res.ok) throw new Error("保存に失敗しました");

      setMsg("登録しました！");
      setChildName("");
      setAgeMonth("");
      setNoEat("");
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
          <select
            className="mt-1 block w-full border rounded px-3 py-2"
            value={noEat}
            onChange={(e) => setNoEat(e.target.value)}
          >
            <option value="">選択してください</option>
            <option value="卵">卵</option>
            <option value="牛乳">牛乳</option>
            <option value="小麦">小麦</option>
            <option value="落花生">落花生</option>
            <option value="そば">そば</option>
          </select>
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
