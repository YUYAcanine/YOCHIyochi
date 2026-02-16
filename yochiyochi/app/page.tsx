"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Page1() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [hiyariNews, setHiyariNews] = useState<
    Array<{
      id: number;
      food_name: string;
      detail: string | null;
      created_at: string;
    }>
  >([]);
  const [newsLoading, setNewsLoading] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncLoginState = () => {
      const stored = localStorage.getItem("yochiLoggedIn") === "true";
      setIsLoggedIn(stored);
      setMemberId(localStorage.getItem("yochiMemberId"));
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "yochiLoggedIn" || event.key === "yochiMemberId") {
        syncLoginState();
      }
    };

    syncLoginState();
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [isLoggedIn, memberId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;

    const fetchNews = async () => {
      setNewsLoading(true);
      setNewsError(null);
      try {
        const res = await fetch("/api/meal-records?type=hiyari&limit=3", {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("fetch failed");
        const json = await res.json();
        if (cancelled) return;
        setHiyariNews(Array.isArray(json) ? json : json.items ?? []);
      } catch {
        if (!cancelled) setNewsError("新着ニュースの取得に失敗しました");
      } finally {
        if (!cancelled) setNewsLoading(false);
      }
    };

    fetchNews();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = () => {
    if (typeof window === "undefined") {
      return;
    }
    localStorage.setItem("yochiLoggedIn", "false");
    localStorage.removeItem("yochiMemberId");
    window.dispatchEvent(new Event("yochi-auth-changed"));
    setIsLoggedIn(false);
    setMemberId(null);
    router.replace("/");
  };

  return (
    <main className="relative min-h-screen bg-[#F0E4D8] grid grid-rows-[auto_auto_1fr] justify-items-center px-6 pt-20 pb-10 gap-6">
      <div className={`top-actions ${isLoggedIn ? "top-actions-logged" : ""}`}>
        {!isLoggedIn && (
          <Link
            href="/login"
            className="btn-secondary fade-up-2"
          >
            マイページ
          </Link>
        )}
        {isLoggedIn && (
          <div className="member-actions">
            {memberId && (
              <span className="member-label fade-up-2">
                {memberId}さんのページ
              </span>
            )}
            <button
              type="button"
              className="btn-secondary fade-up-2"
              onClick={handleLogout}
            >
              ログアウト
            </button>
          </div>
        )}
      </div>
      {/* 上段：ロゴ（1.2倍大きく） */}
      <div className="row-start-1 row-end-2 self-start swoosh-in select-none">
        <Image
          src="/yoyochi.jpg" // /public 配下に置いたファイル
          alt="よちヨチ ロゴ"
          width={1080}
          height={480}
          priority
          className="h-auto w-[min(96vw,1080px)]"
        />
      </div>

      {/* 中段：メインボタン（中央） */}
      <div className="row-start-2 row-end-3 self-start flex flex-col items-center gap-4">
        <Link
          href="/Select"
          className="btn-primary fade-up-1"
        >
          献立チェック
        </Link>
        {isLoggedIn && (
          <Link
            href="/Register"
            className="btn-secondary fade-up-3"
          >
            給食記録
          </Link>
        )}
      </div>

      <div className="row-start-3 row-end-4 w-full max-w-2xl self-start">
        <div className="rounded-2xl border border-[#E8DCD0] bg-[#F5EDE6] p-4 shadow-md">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#5C3A2E]">保育ニュース</h2>
            <span className="text-xs font-semibold text-[#8A776A]">
              ヒヤリハット速報
            </span>
          </div>

          {newsLoading && (
            <p className="text-sm text-[#6B5A4E] mt-3">読み込み中...</p>
          )}
          {newsError && <p className="text-sm text-red-600 mt-3">{newsError}</p>}

          {!newsLoading && !newsError && (
            <>
              {hiyariNews.length > 0 ? (
                <ul className="mt-4 space-y-3">
                  {hiyariNews.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-xl border border-[#E8DCD0] bg-white p-3"
                    >
                      <div className="text-sm font-semibold text-[#4D3F36]">
                        {item.food_name}
                      </div>
                      {item.detail && (
                        <p className="text-sm text-[#6B5A4E] mt-1">{item.detail}</p>
                      )}
                      <div className="text-xs text-[#8A776A] mt-2">
                        {new Date(item.created_at).toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-[#6B5A4E] mt-3">
                  新しいヒヤリハットはありません。
                </p>
              )}
              <div className="mt-4 flex justify-end">
                <Link
                  href="/News"
                  className="text-sm font-semibold text-[#6B5A4E] underline underline-offset-4 hover:opacity-70"
                >
                  すべて見る
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      <style jsx global>{`
        /* ロゴ入場 */
        @keyframes swooshIn {
          0% {
            opacity: 0;
            transform: translateY(64px) scale(0.96);
          }
          50% {
            opacity: 1;
            transform: translateY(0) scale(1.02);
          }
          100% {
            transform: translateY(0) scale(1);
          }
        }
        .swoosh-in {
          animation: swooshIn 2000ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }

        /* フェード */
        @keyframes fadeUp {
          0% {
            opacity: 0;
            transform: translateY(18px) scale(0.98);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .fade-up-1 {
          animation: fadeUp 1200ms 900ms ease-out both;
        }
        .fade-up-2 {
          animation: fadeUp 1200ms 1300ms ease-out both;
        }
        .fade-up-3 {
          animation: fadeUp 1200ms 1600ms ease-out both;
        }

        /* メインボタン：丸角・大きめ文字 */
        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 1.1rem 2rem;
          border-radius: 1rem; /* 丸角 */
          font-weight: 700;
          font-size: 1.5rem; /* 文字大きめ */
          line-height: 1;
          text-decoration: none;
          background: #9c7b6c;
          color: #fff;
          border: 1px solid #8c6f62;
          transition: background-color 0.25s, transform 0.12s, opacity 0.25s;
        }
        .btn-primary:hover {
          background: #a88877;
        }
        .btn-primary:active {
          transform: translateY(1px);
        }
        .btn-secondary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.9rem 1.6rem;
          border-radius: 0.9rem;
          font-weight: 600;
          font-size: 1.2rem;
          line-height: 1;
          text-decoration: none;
          background: #f5ede6;
          color: #6b5a4e;
          border: 1px solid #d6c2b4;
          transition: background-color 0.25s, transform 0.12s, opacity 0.25s;
        }
        .btn-secondary:hover {
          background: #e7dbcf;
        }
        .btn-secondary:active {
          transform: translateY(1px);
        }
        .top-actions {
          position: absolute;
          top: 2rem;
          right: clamp(1rem, 5vw, 3rem);
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .top-actions-logged {
          align-items: flex-end;
        }
        .member-actions {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 0.35rem;
        }
        .member-label {
          font-size: 0.95rem;
          font-weight: 700;
          color: #6b5a4e;
          padding: 0.1rem 0;
        }
        @media (max-width: 640px) {
          .top-actions {
            top: 1rem;
            right: 1rem;
            flex-direction: column;
            align-items: flex-end;
          }
        }

        /* サブリンク：右下だが余白を持たせる */
        .underline-link {
          position: absolute;
          right: 2rem; /* ← 少し余白を増やした */
          bottom: 10rem;
          color: #6b5a4e;
          text-decoration: underline;
          text-underline-offset: 4px;
          font-weight: 600;
          transition: opacity 0.2s ease;
        }
        .underline-link:hover {
          opacity: 0.7;
        }
      `}</style>
    </main>
  );
}

