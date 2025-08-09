import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-zinc-950 dark:to-zinc-900 text-foreground">
      {/* Header */}
      <header className="mx-auto max-w-5xl px-6 sm:px-10 pt-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            className="dark:invert"
            src="/next.svg"
            alt="Next.js logo"
            width={120}
            height={26}
            priority
          />
          <span className="hidden sm:inline-block text-sm text-zinc-500 dark:text-zinc-400">
            App Router / Tailwind / TypeScript
          </span>
        </div>
        <a
          className="inline-flex items-center gap-2 rounded-full border border-black/10 dark:border-white/15 bg-white/70 dark:bg-zinc-900/60 backdrop-blur px-4 py-2 text-sm font-medium hover:shadow-sm transition"
          href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image aria-hidden src="/globe.svg" alt="" width={16} height={16} />
          Docs
        </a>
      </header>

      {/* Main card */}
      <main className="mx-auto max-w-5xl px-6 sm:px-10 py-10">
        <section className="relative isolate">
          {/* subtle focus ring */}
          <div className="absolute inset-0 -z-10 blur-3xl opacity-20 dark:opacity-30"
               aria-hidden />
          <div className="rounded-2xl border border-black/5 dark:border-white/10 bg-white/80 dark:bg-zinc-900/60 backdrop-blur shadow-sm">
            <div className="p-8 sm:p-12">
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
                Welcome to your Next.js app
              </h1>
              <p className="mt-3 text-zinc-600 dark:text-zinc-400">
                ここから好きなUIに育てていきましょう。編集は
                <code className="mx-1 rounded bg-black/5 dark:bg-white/10 px-1.5 py-0.5 font-mono text-[0.9em]">
                  app/page.tsx
                </code>
                をどうぞ。
              </p>

              {/* steps */}
              <ol className="mt-8 space-y-2 font-mono text-sm text-zinc-700 dark:text-zinc-300">
                <li className="flex items-start gap-2">
                  <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-[11px]">1</span>
                  Get started by editing <code className="mx-1 rounded bg-black/5 dark:bg-white/10 px-1">app/page.tsx</code>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 text-[11px]">2</span>
                  Save and see your changes instantly.
                </li>
              </ol>

              {/* actions */}
              <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
                <a
                  className="group inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 px-5 h-12 font-medium shadow-sm ring-1 ring-black/10 dark:ring-white/20 hover:translate-y-[-1px] transition"
                  href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image
                    className="dark:invert-0"
                    src="/vercel.svg"
                    alt="Vercel"
                    width={20}
                    height={20}
                  />
                  Deploy now
                  <span aria-hidden className="transition group-hover:translate-x-0.5">→</span>
                </a>

                <a
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 dark:border-white/15 bg-white/70 dark:bg-zinc-900/40 backdrop-blur px-5 h-12 font-medium hover:shadow-sm transition"
                  href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image aria-hidden src="/file.svg" alt="" width={16} height={16} />
                  Learn
                </a>

                <a
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 dark:border-white/15 bg-white/70 dark:bg-zinc-900/40 backdrop-blur px-5 h-12 font-medium hover:shadow-sm transition"
                  href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Image aria-hidden src="/window.svg" alt="" width={16} height={16} />
                  Templates
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Quick links row */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <a
            href="https://nextjs.org"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-zinc-900/60 backdrop-blur p-5 hover:shadow-sm transition"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <Image aria-hidden src="/globe.svg" alt="" width={16} height={16} />
              nextjs.org
              <span aria-hidden className="ml-auto opacity-60 group-hover:opacity-100 transition">→</span>
            </div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              公式サイト。最新情報とAPIリファレンス。
            </p>
          </a>

          <a
            href="https://tailwindcss.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-zinc-900/60 backdrop-blur p-5 hover:shadow-sm transition"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <Image aria-hidden src="/window.svg" alt="" width={16} height={16} />
              Tailwind Docs
              <span aria-hidden className="ml-auto opacity-60 group-hover:opacity-100 transition">→</span>
            </div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              ユーティリティクラスで高速にスタイル。
            </p>
          </a>

          <a
            href="https://vercel.com/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="group rounded-2xl border border-black/5 dark:border-white/10 bg-white/70 dark:bg-zinc-900/60 backdrop-blur p-5 hover:shadow-sm transition"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <Image aria-hidden src="/vercel.svg" alt="" width={16} height={16} />
              Vercel Docs
              <span aria-hidden className="ml-auto opacity-60 group-hover:opacity-100 transition">→</span>
            </div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              デプロイや環境変数の設定ガイド。
            </p>
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="mx-auto max-w-5xl px-6 sm:px-10 pb-10 text-center text-xs text-zinc-500 dark:text-zinc-400">
        Built with Next.js + Tailwind. Edit <code className="bg-black/5 dark:bg-white/10 px-1 rounded">app/page.tsx</code>.
      </footer>
    </div>
  );
}

