// app/page1/page.tsx
"use client";

import Image from "next/image";
import Link from "next/link";

export default function Page1() {
  return (
    <main className="relative min-h-screen bg-[#F0E4D8] grid grid-rows-[1fr_auto_1fr] justify-items-center px-6">
      {/* 上段：ロゴ（1.2倍大きく） */}
      <div className="row-start-1 row-end-2 self-end mb-6 swoosh-in select-none">
        <Image
          src="/yoyochi.jpg"                 // /public 配下に置いたファイル
          alt="よちヨチ ロゴ"
          width={1080}
          height={480}
          priority
          className="h-auto w-[min(96vw,1080px)]"
        />
      </div>

      {/* 中段：メインボタン（中央） */}
      <div className="row-start-2 row-end-3 place-self-center">
        <Link href="/page2" className="btn-primary fade-up-1">
          チェックをはじめる
        </Link>
      </div>

      {/* 右下：サブリンク（少し内側に配置） */}
      <Link
        href="/page4"
        className="underline-link fade-up-2"
      >
        食べられない食品を登録する
      </Link>

      <style jsx global>{`
        /* ロゴ入場 */
        @keyframes swooshIn {
          0%   { opacity: 0; transform: translateY(64px) scale(.96); }
          50%  { opacity: 1; transform: translateY(0) scale(1.02); }
          100% { transform: translateY(0) scale(1); }
        }
        .swoosh-in { animation: swooshIn 2000ms cubic-bezier(.2,.8,.2,1) both; }

        /* フェード */
        @keyframes fadeUp {
          0%   { opacity: 0; transform: translateY(18px) scale(.98); }
          100% { opacity: 1; transform: translateY(0)    scale(1); }
        }
        .fade-up-1 { animation: fadeUp 1200ms 900ms ease-out both; }
        .fade-up-2 { animation: fadeUp 1200ms 1300ms ease-out both; }

        /* メインボタン：丸角・大きめ文字 */
        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 1.1rem 2rem;
          border-radius: 1rem;           /* 丸角 */
          font-weight: 700;
          font-size: 1.5rem;             /* 文字大きめ */
          line-height: 1;
          text-decoration: none;
          background: #9C7B6C;
          color: #fff;
          border: 1px solid #8c6f62;
          transition: background-color .25s, transform .12s, opacity .25s;
        }
        .btn-primary:hover { background: #A88877; }
        .btn-primary:active { transform: translateY(1px); }

        /* サブリンク：右下だが余白を持たせる */
        .underline-link {
          position: absolute;
          right: 2rem;      /* ← 少し余白を増やした */
          bottom: 10rem;
          color: #6B5A4E;
          text-decoration: underline;
          text-underline-offset: 4px;
          font-weight: 600;
          transition: opacity .2s ease;
        }
        .underline-link:hover { opacity: .7; }
      `}</style>
    </main>
  );
}
