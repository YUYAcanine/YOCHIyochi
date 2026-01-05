"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { event } from "@/lib/gtag"; // GAイベント送信用

export default function Page1() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const syncLoginState = () => {
      const stored = localStorage.getItem("yochiLoggedIn") === "true";
      setIsLoggedIn(stored);
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "yochiLoggedIn") {
        syncLoginState();
      }
    };

    syncLoginState();
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const handleLogout = () => {
    if (typeof window === "undefined") {
      return;
    }
    localStorage.setItem("yochiLoggedIn", "false");
    setIsLoggedIn(false);
    router.replace("/");
  };

  return (
    <main className="relative min-h-screen bg-[#F0E4D8] grid grid-rows-[1fr_auto_1fr] justify-items-center px-6">
      <div className="top-actions">
        <Link
          href="/Login"
          className="btn-secondary fade-up-2"
          onClick={() =>
            event({
              action: "login_click",
              category: "button",
              label: "page1 login",
            })
          }
        >
        マイページ
        </Link>
        {isLoggedIn && (
          <button
            type="button"
            className="btn-secondary fade-up-2"
            onClick={handleLogout}
          >
            ログアウト
          </button>
        )}
      </div>
      {/* 上段：ロゴ（1.2倍大きく） */}
      <div className="row-start-1 row-end-2 self-end mb-6 swoosh-in select-none">
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
      <div className="row-start-2 row-end-3 place-self-center flex flex-col items-center gap-4">
        <Link
          href="/Select"
          className="btn-primary fade-up-1"
          onClick={() =>
            event({
              action: "start_check_click",
              category: "button",
              label: "page1 main",
            })
          }
        >
          チェックをはじめる
        </Link>
        {isLoggedIn && (
          <Link
            href="/Register"
            className="btn-secondary fade-up-3"
            onClick={() =>
              event({
                action: "no_eat_register_click",
                category: "button",
                label: "page1 no_eat",
              })
            }
          >
            食べられない食品を登録する
          </Link>
        )}
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

