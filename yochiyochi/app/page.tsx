"use client";

import Button from "@/components/Button";

export default function Page1() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white">
      {/* メニューを登録するボタン */}
      <Button href="/page2" variant="blue">
        メニューをチェックする
      </Button>
    </main>
  );
}


