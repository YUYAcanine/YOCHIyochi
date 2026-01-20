"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Ribbon from "@/components/Ribbon";

type Answer = {
  id: number;
  child_name: string;
  age_month: number;
  no_eat: string;
  note: string | null;
  created_at: string;
};

export default function Page5() {
  const router = useRouter();
  const [data, setData] = useState<Answer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (typeof window === "undefined") return;
        const loggedIn = localStorage.getItem("yochiLoggedIn") === "true";
        const storedMemberId = localStorage.getItem("yochiMemberId");
        if (!loggedIn || !storedMemberId) {
          router.replace("/Login");
          return;
        }
        setMemberId(storedMemberId);
        setAuthChecked(true);
        const res = await fetch(
          `/api/answers?member_id=${encodeURIComponent(storedMemberId)}`,
          { cache: "no-store" }
        );
        if (!res.ok) throw new Error("fetch failed");
        const json = await res.json();
        setData(Array.isArray(json) ? json : json.items ?? []);
      } catch {
        setError("データ取得に失敗しました。");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (!authChecked) {
    return null;
  }

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
      <div className="pt-24 px-6 pb-10">
        <h1 className="text-xl font-bold mb-4">登録情報の確認</h1>

        {loading && <p className="text-[#6B5A4E]">読み込み中...</p>}
        {error && <p className="text-red-600">{error}</p>}

        {!loading && !error && (
          <div className="overflow-x-auto bg-white rounded-2xl border border-[#E8DCD0] shadow-md">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#EFE2D6] text-left text-[#5C4B40]">
                  <th className="border-b border-[#E8DCD0] p-3">ID</th>
                  <th className="border-b border-[#E8DCD0] p-3">園児の名前</th>
                  <th className="border-b border-[#E8DCD0] p-3">月齢</th>
                  <th className="border-b border-[#E8DCD0] p-3">食べられない食品</th>
                  <th className="border-b border-[#E8DCD0] p-3">備考</th>
                  <th className="border-b border-[#E8DCD0] p-3">登録日時</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={row.id}>
                    <td className="border-b border-[#F1E7DD] p-3">{row.id}</td>
                    <td className="border-b border-[#F1E7DD] p-3">
                      {row.child_name}
                    </td>
                    <td className="border-b border-[#F1E7DD] p-3">{row.age_month}</td>
                    <td className="border-b border-[#F1E7DD] p-3">{row.no_eat}</td>
                    <td className="border-b border-[#F1E7DD] p-3">{row.note || "-"}</td>
                    <td className="border-b border-[#F1E7DD] p-3">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td className="p-4 text-center text-[#8A776A]" colSpan={6}>
                      データがありません。
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-[#D6C2B4] bg-[#F5EDE6] px-5 py-2 font-semibold text-[#6B5A4E] shadow-sm transition hover:bg-[#E7DBCF]"
          >
            ホームに戻る
          </Link>
          <Link
            href="/Register"
            className="inline-flex items-center justify-center rounded-xl bg-[#9C7B6C] px-5 py-2 font-semibold text-white shadow-sm transition hover:bg-[#A88877]"
          >
            給食記録に戻る
          </Link>
        </div>
      </div>
    </main>
  );
}
