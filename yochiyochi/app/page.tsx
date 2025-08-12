"use client";

import Button from "@/components/Button";

export default function Page1() {
  return (

    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gray-50">
    <Button href="/page2" variant="blue">
      メニューをチェックする
    </Button>
    <Button href="/page4" variant="purple">
      食べられない食品を登録する
    </Button>
    </main>

  );
}


