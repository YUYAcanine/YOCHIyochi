// app/page5/page.tsx
"use client";

import { useEffect, useState } from "react";
import Button from "@/components/Button";

type Answer = {
  id: number;
  child_name: string;
  age_month: number;
  no_eat: string;
  createdAt: string;
};

export default function Page5() {
  const [data, setData] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/answers", { cache: "no-store" });
        if (!res.ok) throw new Error("fetch failed");
        const json = await res.json();
        // API が { items: rows } を返す場合は json.items に合わせる
        setData(Array.isArray(json) ? json : json.items ?? []);
      } catch (e) {
        setError("データ取得に失敗しました");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-lg font-bold mb-4">登録内容の確認</h1>

      {loading && <p>読み込み中...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow rounded">
            <thead>
              <tr className="bg-gray-200 text-left">
                <th className="border p-2">ID</th>
                <th className="border p-2">園児の名前</th>
                <th className="border p-2">月齢</th>
                <th className="border p-2">食べられない食品</th>
                <th className="border p-2">登録日時</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id}>
                  <td className="border p-2">{row.id}</td>
                  <td className="border p-2">{row.child_name}</td>
                  <td className="border p-2">{row.age_month}</td>
                  <td className="border p-2">{row.no_eat}</td>
                  <td className="border p-2">
                    {new Date(row.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td className="border p-2" colSpan={5}>
                    データがありません
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-4 mt-6">
        <Button href="/" variant="gray">ホームに戻る</Button>
        <Button href="/page4" variant="blue">新規登録</Button>
      </div>
    </main>
  );
}
